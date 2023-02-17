import { MouseEventHandler, useEffect, useRef, useState } from 'react';
import './App.scss';
import { Synthesia, SynthesiaCreateVideo, SynthesiaGetVideo, Input, InputConfig, SynthesiaVideoResponse } from '../lib/synthesia';
import { AxiosResponse } from 'axios';
import Player from './components/Player';
import { Configuration, OpenAIApi } from 'openai';
import mainVideo from '/santa-main.mp4';
import bodyCare from '/santa-cuidado-del-cuerpo.mp4';
import lack from '/santa-escasez.mp4';
import noneVideo from '/santa-none.mp4';
import sendSvg from './assets/send.svg';

const videosDatabase = {
  'Cuidado personal': bodyCare,
  'None': noneVideo,
  'Escasez': lack,
  'Futuro': lack
};

function App() {
  const inputTextRef = useRef<HTMLInputElement>(null);
  const chatContainer = useRef<HTMLDivElement>(null);
  const videoContainer = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<string[]>([]);
  /* filo stack */
  const [videos, setVideos] = useState<string[]>([]);

  // useEffect(() => {
  //   chatContainer.current!.scrollTo({ top: Number.MAX_SAFE_INTEGER });
  // }, [messages.length]);

  useEffect(() => {
    if (videoContainer.current) {
      videoContainer.current.play();
    }

    console.log('Video: ', videos.at(0) || mainVideo);
  }, [videos.length]);

  async function getOpenaiAnswer(text: string) {
    const configuration = new Configuration({
      apiKey: import.meta.env.VITE_OPENAI_SECRET_KEY,
    });
    const openai = new OpenAIApi(configuration);
    // const header = 'Answer in one word or "None". Which of the following strings "Love", "Friendship", "Feelings", "Work", "Money" describes better the following text?:';
    const header = 'Textos: "Cuidado del cuerpo", "Futuro" y "Escasez".\nResponde única y estrictamente con el texto que mejor describa la siguiente sentencia o con "None": ';
    const prompt = header + text.trim();

    console.log({ prompt });
    // ¿Qué puedo esperar del futuro?
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.7,
      max_tokens: 50,
      n: 1,
      stop: '\n'
    });

    console.log(completion.data.choices);

    return completion.data.choices[0].text;
  }

  async function getSynthesiaVideo(text: string, notify: (response: SynthesiaVideoResponse) => void) {
    const synth = new Synthesia({
      token: import.meta.env.VITE_SYNTHESIA_TOKEN,
      test: import.meta.env.VITE_SYNTHESIA_TEST_MODE
    });

    console.time('Synthesia create video request');
    console.log('createVideo');
    const createVideo = await synth.request(new SynthesiaCreateVideo([
      new Input({
        scriptText: text,
        avatar: import.meta.env.VITE_SYNTHESIA_AVATAR,
      })
    ]));
    console.timeEnd('Synthesia create video request');
    console.log('end createVideo');

    if (createVideo.status === 201) {
      const interval = setInterval(async () => {
        console.time('Synthesia get video request');
        const getVideo = await synth.request(new SynthesiaGetVideo(createVideo.data.id));
        console.timeEnd('Synthesia get video request');


        console.log({ status: getVideo.data.status });

        if (getVideo.status > 205 || getVideo.data.status === 'complete') {
          notify(getVideo.data);
          return clearInterval(interval);
        }
      }, 10000);
    }

  }

  async function clickHandler(e: React.MouseEvent<HTMLButtonElement>) {
    if (!inputTextRef) {
      return;
    }

    const question = inputTextRef.current!.value;

    if (question === '') {
      return;
    }

    console.log('Question:', question);
    console.time('OpenAI');
    const chatGPTAnswer = (await getOpenaiAnswer(question))!.split(/\s/g).at(-1);
    console.timeEnd('OpenAI');
    // console.log('End question');
    inputTextRef.current!.value = '';
    setMessages([...messages, chatGPTAnswer]);
    // chatContainer.current!.scrollTop = chatContainer.current!.scrollHeight;

    // getSynthesiaVideo(chatGPTAnswer, (response) => {
    //   setMessages([...messages, chatGPTAnswer]);
    //   pushVideo(response.download!);
    //   // console.log(response.download);
    //   console.timeEnd("Synthesia");

    // });

    console.log('Item:', chatGPTAnswer);

    /* @ts-ignore */
    pushVideo(videosDatabase[chatGPTAnswer.replace(/[^0-9a-z]/gi, '')]);
  }

  function pushVideo(url: string) {
    console.log(url);
    setVideos([...videos, url]);
  }

  function nextVideo() {
    if (videos.length === 0) {
      return;
    }

    const video = videos.shift()!;
    setVideos([...videos]);
  }

  function playVideo() {
    if (videoContainer.current) {
      videoContainer.current.play();
    }
  }

  function onVideoEnd() {
    nextVideo();
  }

  return (
    <div className='app-main'>
      <Player cref={videoContainer} onClick={playVideo} className='avatar' src={videos.at(0) || mainVideo} onEnded={onVideoEnd} autoPlay />
      <div className='chat-container'>
        <div className="chat-header">
          <div className="chat-header-avatar">
            J
          </div>
          <div className="chat-header-info">
            <h3 className="chat-header-info-title">Jhon Doe</h3>
            <p className="chat-header-info-content">last seen 2h ago</p>
          </div>
        </div>
        <div ref={chatContainer} className='chat-placeholder'>
          {messages.map((message, index) => <div className='chat-placeholder-bubble' key={`${message}${index}`}>{message}</div>)}
        </div>
        <div className="chat-actions">
          <input ref={inputTextRef} type='text' className='chat-actions-input' placeholder='Your question here!' maxLength={1000} />
          <button onClick={clickHandler} type='button' className='chat-actions-send'><img src={sendSvg} alt="send" /></button>
        </div>
      </div>
    </div>
  );
};

export default App;
