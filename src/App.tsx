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
import missVideo from '/santa-extrañas-a-alguien.mp4';
import { debug, getOpenaiAnswer } from './utils';

const videosDatabase = {
  'Cuidado personal': bodyCare,
  'None': noneVideo,
  'Escasez': lack,
  'Futuro': lack,
  'Extrañar a alguien': missVideo
};

function App() {
  const inputTextRef = useRef<HTMLInputElement>(null);
  const chatContainer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<string[]>([]);
  /* filo stack */
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    chatContainer.current!.scrollTo({ top: Number.MAX_SAFE_INTEGER });
  }, [messages.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }

    if (debug()) {
      console.log('Video: ', videos.at(0) || mainVideo);
    }
  }, [videos.length]);

  async function clickHandler(e: React.MouseEvent<HTMLButtonElement>) {
    if (!inputTextRef) {
      return;
    }

    const question = inputTextRef.current!.value;

    if (question === '') {
      return;
    }

    if (debug()) {
      console.time('OpenAI');
    }

    const chatGPTAnswer = ((await getOpenaiAnswer(question))!.split('\n\n')[1] || '').trim().replace('"', '');

    if (debug()) {
      console.timeEnd('OpenAI');
    }

    inputTextRef.current!.value = '';

    if (debug()) {
      console.log('OpenAI text:', chatGPTAnswer);
    }
    /* @ts-ignore */
    setVideos([...videos, videosDatabase[chatGPTAnswer]]);
  }

  function getMedia() {
    return videos[0] || mainVideo;
  }

  function onVideoClick(e: React.MouseEvent<HTMLVideoElement>) {
    const current = e.currentTarget;

    if (current.paused) {
      return current.play();
    }

    current.pause();
  }

  function getNextVideo() {
    if (videos.length === 0) {
      return;
    }

    const video = videos.shift()!;
    setVideos([...videos]);
  }

  return (
    <div className='flex justify-center items-center w-screen h-screen bg-[#E1B6B6]'>
      <Player cref={videoRef} onClick={onVideoClick} className='w-full h-screen' src={getMedia()} onEnded={getNextVideo} autoPlay />
      <div className='flex flex-col space-y-2 w-4/6 absolute bottom-2 drop-shadow-2xl opacity-80'>
        <div ref={chatContainer} className='flex flex-col space-y-2 h-32 w-full text-white bg-pink-800 overflow-y-scroll p-3'>
          {messages.map((message, index) => <span key={`${message}${index}`}>{message}</span>)}
        </div>
        <input ref={inputTextRef} type='text' className='bg-pink-300 px-3 text-black' placeholder='Your question here!' maxLength={1000} />
        <button onClick={clickHandler} type='button' className='bg-pink-300 text-black w-full'>Send</button>
      </div>
    </div>
  );
};

export default App;
