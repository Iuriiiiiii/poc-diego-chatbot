import { MouseEventHandler, useEffect, useRef, useState } from 'react';
import './App.scss';
import { Synthesia, SynthesiaCreateVideo, SynthesiaGetVideo, Input, InputConfig, SynthesiaVideoResponse } from '../lib/synthesia';
import { AxiosResponse } from 'axios';
import Player from './components/Player';
import { Configuration, OpenAIApi } from 'openai';
import baseVideo from '/base.mp4';
import feelingsVideo from '/feelings.mp4';
import friendshipsVideo from '/friendships.mp4';
import moneyVideo from '/money.mp4';
import loveVideo from '/love.mp4';
import noneVideo from '/none.mp4';

const videosDatabase = {
  'Feelings': feelingsVideo,
  'Friendship': friendshipsVideo,
  'Money': moneyVideo,
  'Love': loveVideo,
  'None': noneVideo,
};

function App() {
  const inputTextRef = useRef<HTMLInputElement>(null);
  const chatContainer = useRef<HTMLDivElement>(null);
  const videoContainer = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<string[]>([]);
  /* filo stack */
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    chatContainer.current!.scrollTo({ top: Number.MAX_SAFE_INTEGER });
  }, [messages.length]);

  useEffect(() => {
    if (videoContainer.current) {
      videoContainer.current.play();
    }

    console.log(videos.at(0) || baseVideo);
  }, [videos.length]);

  async function getOpenaiAnswer(text: string) {
    const configuration = new Configuration({
      apiKey: import.meta.env.VITE_OPENAI_SECRET_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const header = 'Answer in one word or "None". Which of the following strings "Love", "Friendship", "Feelings", "Work", "Money" describes better the following text?:';
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: header + text,
      temperature: 0.6,
      max_tokens: 1000
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
    const createVideo = await synth.request(new SynthesiaCreateVideo([
      new Input({
        scriptText: text
      })
    ]));
    console.timeEnd('Synthesia create video request');

    if (createVideo.status === 201) {
      const interval = setInterval(async () => {
        const getVideo = await synth.request(new SynthesiaGetVideo(createVideo.data.id));

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

    console.time('OpenAI');
    const chatGPTAnswer = (await getOpenaiAnswer(question))!.split(/\s/g).at(-1);
    console.timeEnd('OpenAI');

    inputTextRef.current!.value = '';
    // setMessages([...messages, chatGPTAnswer]);
    // chatContainer.current!.scrollTop = chatContainer.current!.scrollHeight;

    // getSynthesiaVideo(chatGPTAnswer, (response) => {
    //   setMessages([...messages, chatGPTAnswer]);
    //   pushVideo(response.download!);
    //   // console.log(response.download);
    //   console.timeEnd("Synthesia");

    // });

    console.log(chatGPTAnswer);

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
    <div className='flex justify-center items-center w-screen h-screen bg-pink-300'>
      <Player cref={videoContainer} onClick={playVideo} className='w-screen h-screen' src={videos.at(0) || baseVideo} onEnded={onVideoEnd} autoPlay />
      <div className='flex flex-col space-y-2 w-4/6 absolute bottom-2 drop-shadow-2xl opacity-80'>
        <div ref={chatContainer} className='flex flex-col space-y-2 h-32 w-full text-black bg-pink-300 overflow-y-scroll p-3'>
          {messages.map((message, index) => <span key={`${message}${index}`}>{message}</span>)}
        </div>
        <input ref={inputTextRef} type='text' className='bg-pink-300 px-3 text-black' placeholder='Your question here!' maxLength={1000} />
        <button onClick={clickHandler} type='button' className='bg-pink-300 text-black w-full'>Send</button>
      </div>
    </div>
  );
};

export default App;
