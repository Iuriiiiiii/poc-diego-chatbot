import { Configuration, OpenAIApi } from "openai";
import {
  Input,
  Synthesia,
  SynthesiaCreateVideo,
  SynthesiaGetVideo,
  SynthesiaVideoResponse,
} from "../../lib/synthesia";
import "lostjs";
import axios from "axios";

export function debug(): boolean {
  return import.meta.env.VITE_DEBUG;
}

export async function getSynthesiaVideo(
  text: string,
  notify: (response: SynthesiaVideoResponse) => void
) {
  const synth = new Synthesia({
    token: import.meta.env.VITE_SYNTHESIA_TOKEN,
    test: import.meta.env.VITE_SYNTHESIA_TEST_MODE,
  });

  if (debug()) {
    console.time("Synthesia create video request");
  }

  const createVideo = await synth.request(
    new SynthesiaCreateVideo([
      new Input({
        scriptText: text,
        avatar: import.meta.env.VITE_SYNTHESIA_AVATAR,
      }),
    ])
  );

  if (debug()) {
    console.timeEnd("Synthesia create video request");
  }

  if (createVideo.status === 201) {
    let debugCounter = 0;

    const interval = setInterval(async () => {
      if (debug()) {
        console.time("Synthesia get video request Nº" + debugCounter);
      }

      const getVideo = await synth.request(
        new SynthesiaGetVideo(createVideo.data.id)
      );

      if (debug()) {
        console.timeEnd("Synthesia get video request Nº" + debugCounter);
        debugCounter++;
      }

      if (getVideo.status > 205 || getVideo.data.status === "complete") {
        notify(getVideo.data);
        return clearInterval(interval);
      }
    }, 10000);
  }
}

/*
Extraño mucho a mi mejor amiga
Quiero conseguir más lana
¿Cómo puedo conseguir mas guita?
Amo a mi familia.
Mi hermana se fue de viaje, quisiera verla.
Quiero estar mas saludable ¿Qué puedo hacer?
Me siento muy cansado todo el tiempo.
No tengo mucha confianza.
Espero poder viajar algún día.
Algún día tendré una casa grande y familia?
Mis hijos se comportan terriblemente, no sé que hacer.

*/

export async function getOpenaiAnswer(text: string) {
  // "Texto" habla sobre familia o familiares. Resultado: Familia.
  // Analiza las siguientes condiciones y devuelve únicamente el valor de la variable "Resultado".

  const header = `
"Lana", "plata", "guita" y "varo" significan "Dinero".
Sigue el siguiente formato: Condición. Resultado.
"Texto" habla sobre obtener más dinero, ganar más dinero, anhelar más dinero o desear más dinero. Resultado: Ganar dinero.
"Texto" habla sobre extrañar a personas, desear ver y/o estar cerca de personas. Resultado: Extrañar a alguien.
"Texto" habla sobre cuidado personal, mejorar el cuerpo, mejorar la condición, salud, ejercicios o cuidado del cuerpo. Resultado: Cuidado del cuerpo.
"Texto" habla sobre escasez, falta de algo material, esperar conseguir algo en el futuro o deseo de conseguir algo material diferente al dinero. Resultado: Escasez.
"Texto" habla sobre la confianza en uno mismo o la carencia de esta. Resultado: Confianza en uno mismo.
"Texto" habla sobre el futuro, planes futuros o deseos para el futuro. Resultado: Futuro.
"Texto" habla sobre el cuidado de los hijos, el comportamiento de los hijos, la actitud de los hijos, ayudar a los hijos, mejorar el comportamiento de los hijos o criar a los hijos. Resultado: Ayudar hijos.
"Texto" no cumple ninguna de las condiciones anteriores. Resultado: Ninguno.
Texto: 
`.trim();
  const configuration = new Configuration({
    apiKey: import.meta.env.VITE_OPENAI_SECRET_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const prompt = header + " " + text.trim();

  if (debug()) {
    console.log("OpenAI Prompt:", prompt);
  }

  try {
    const completion = await openai.createCompletion({
      model: import.meta.env.VITE_AI_MODEL,
      prompt,
      temperature: 0.6,
      max_tokens: 50,
      n: 1,
    });

    if (debug()) {
      console.log("OpenAI Result:", completion.data.choices);
    }

    return completion.data.choices[0].text;
  } catch (error) {
    if (debug()) {
      console.error(error);
    }

    return "Ninguno";
  }
}

interface IVideoElement {
  topic: string;
  video: string | string[];
}

const videoMain = "santa-main";
const videoUnknown = "default";
const videosDatabase: IVideoElement[] = [
  {
    topic: "Futuro",
    video: "santa-escasez",
  },
  {
    topic: "Extrañar a alguien",
    video: "santa-extrañas-a-alguien",
  },
  {
    topic: "Cuidado del cuerpo",
    video: "diego-cuidado-del-cuerpo",
  },
  {
    topic: "Escasez",
    video: "santa-escasez",
  },
  {
    topic: "Confianza en uno mismo",
    video: "sentir",
  },
  {
    topic: "Ayudar hijos",
    video: "santa-quieres-cambiar-la-vida-de-tus-hijos",
  },
  {
    topic: "Ganar dinero",
    video: "dinero",
  },
];

export interface IVideo {
  src: string;
  video: string;
}
interface IMessage {
  message: string;
}

function getMainVideo() {
  return videoMain;
}

export function getMainVideoSrc() {
  return `/${getMainVideo()}.mp4`;
}

export async function getAnswerTextByVideo(video: string): Promise<IMessage> {
  return {
    message: (await axios.get<string>(`/subtitles/${video}.txt`)).data,
  };
}

export function getAnswerByTopic(topic: string): IVideo {
  const answer = videosDatabase.find((element) => element.topic === topic);

  if (answer) {
    let src = answer.video;

    if (src instanceof Array) {
      src = src.random();
    }

    return {
      video: src,
      src: `/${src}.mp4`,
    };
  }

  return {
    video: videoUnknown,
    src: `/${videoUnknown}.mp4`,
  };
}

export function isVideoPlaying(video: HTMLVideoElement | null) {
  if (!video) {
    return false;
  }

  return !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  );
}
