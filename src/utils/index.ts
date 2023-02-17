import { Configuration, OpenAIApi } from 'openai';
import { Input, Synthesia, SynthesiaCreateVideo, SynthesiaGetVideo, SynthesiaVideoResponse } from '../../lib/synthesia';

export function debug(): boolean {
    return import.meta.env.VITE_DEBUG;
}

export async function getSynthesiaVideo(text: string, notify: (response: SynthesiaVideoResponse) => void) {
    const synth = new Synthesia({
        token: import.meta.env.VITE_SYNTHESIA_TOKEN,
        test: import.meta.env.VITE_SYNTHESIA_TEST_MODE
    });

    if (debug()) {
        console.time('Synthesia create video request');
    }

    const createVideo = await synth.request(new SynthesiaCreateVideo([
        new Input({
            scriptText: text,
            avatar: import.meta.env.VITE_SYNTHESIA_AVATAR,
        })
    ]));

    if (debug()) {
        console.timeEnd('Synthesia create video request');
    }

    if (createVideo.status === 201) {
        let debugCounter = 0;

        const interval = setInterval(async () => {
            if (debug()) {
                console.time('Synthesia get video request Nº' + debugCounter);
            }

            const getVideo = await synth.request(new SynthesiaGetVideo(createVideo.data.id));

            if (debug()) {
                console.timeEnd('Synthesia get video request Nº' + debugCounter);
                debugCounter++;
            }

            if (getVideo.status > 205 || getVideo.data.status === 'complete') {
                notify(getVideo.data);
                return clearInterval(interval);
            }
        }, 10000);
    }

}

export async function getOpenaiAnswer(text: string) {
    const configuration = new Configuration({
        apiKey: import.meta.env.VITE_OPENAI_SECRET_KEY,
    });
    const openai = new OpenAIApi(configuration);
    // const header = 'Answer in one word or "None". Which of the following strings "Love", "Friendship", "Feelings", "Work", "Money" describes better the following text?:';
    const header = `
Textos: "Cuidado del cuerpo", "Esperar del futuro", "Futuro", "Extrañar a alguien" y "Escasez".
Responde únicamente con uno de los textos que mejor describa la siguiente sentencia, si nunguna de ellas encaja, response con "None".:
`.trim();
    const prompt = header + ' ' + text.trim();

    if (debug()) {
        console.log('OpenAI Prompt:', prompt);
    }

    const completion = await openai.createCompletion({
        model: 'text-davinci-002',
        prompt,
        temperature: 0.6,
        max_tokens: 50,
        n: 1,
    });

    if (debug()) {
        console.log('OpenAI Result:', completion.data.choices);
    }

    return completion.data.choices[0].text;
}