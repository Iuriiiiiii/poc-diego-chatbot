import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
import './App.scss';
import { Synthesia, SynthesiaCreateVideo, SynthesiaGetVideo, Input, InputConfig, SynthesiaVideoResponse } from '../lib/synthesia';
import axios, { AxiosResponse } from 'axios';
import Player from './components/Player';
import { Configuration, OpenAIApi } from 'openai';
import mainVideo from '/santa-main.mp4';
import bodyCare from '/santa-cuidado-del-cuerpo.mp4';
import lack from '/santa-escasez.mp4';
import noneVideo from '/santa-no-sé.mp4';
import missVideo from '/santa-extrañas-a-alguien.mp4';
import { debug, getOpenaiAnswer } from './utils';
import bodyCareSubtitle from '/subtitles/santa-cuidado-del-cuerpo.txt';
import noneVideoSubtitle from '/subtitles/santa-no-sé.txt';
import lackSubtitle from '/subtitles/santa-escasez.txt';
import missVideoSubtitle from '/subtitles/santa-extrañas-a-alguien.txt';

const videosDatabase = {
  'Cuidado personal': bodyCare,
  'None': noneVideo,
  'Escasez': lack,
  'Futuro': lack,
  'Esperar del futuro': lack,
  'Falta': lack,
  'Extrañar a alguien': missVideo
};

const subtitlesDatabase = {
  [bodyCare]: bodyCareSubtitle,
  [noneVideo]: noneVideoSubtitle,
  [lack]: lackSubtitle,
  [missVideo]: missVideoSubtitle
};

const enum UserType {
  bot,
  user
}

interface MessageType {
  userType: UserType,
  message: string;
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
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

  async function onButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!inputRef) {
      return;
    }

    const question = inputRef.current!.value;

    if (question === '') {
      return;
    }

    if (debug()) {
      console.time('OpenAI');
    }

    const chatGPTAnswer = ((await getOpenaiAnswer(question))!.split('\n\n')[1] || '').trim().replace('"', '');

    return writeMessage(UserType.bot, question);

    if (debug()) {
      console.timeEnd('OpenAI');
    }

    writeMessage(UserType.user, question);
    inputRef.current!.value = '';

    if (debug()) {
      console.log('OpenAI text:', chatGPTAnswer);
    }
    /* @ts-ignore */
    setVideos([...videos, videosDatabase[chatGPTAnswer]]);
  }

  function writeMessage(userType: UserType, message: string) {
    setMessages([...messages, { userType, message }]);
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

  async function onVideoPlay(e: React.SyntheticEvent<HTMLVideoElement>) {
    try {
      /* @ts-ignore */
      const content = (await axios.get<string>(subtitlesDatabase[getMedia()])).data;
      writeMessage(UserType.bot, content);
    } catch (e) { }
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
      <Player cref={videoRef} onClick={onVideoClick} onPlay={onVideoPlay} className='w-full h-screen' src={getMedia()} onEnded={getNextVideo} autoPlay />
      <div className='flex flex-col space-y-2 w-4/6 absolute bottom-2 drop-shadow-2xl opacity-80'>
        <div ref={chatContainer} className='flex flex-col space-y-2 h-32 w-full text-white bg-pink-800 overflow-y-scroll p-3'>
          {messages.map((message, index) => <span key={`${message}${index}`}>{message.message}</span>)}
        </div>
        <input ref={inputRef} type='text' className='bg-pink-300 px-3 text-black' placeholder='Your question here!' maxLength={1000} />
        <button onClick={onButtonClick} type='button' className='bg-pink-300 text-black w-full'>Send</button>
      </div>
    </div>
  );
};

export default App;
