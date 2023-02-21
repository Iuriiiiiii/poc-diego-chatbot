import React, { useEffect, useRef, useState } from 'react';
import './App.scss';
import Player from './components/Player';
import { debug, getAnswerByTopic, getAnswerTextByVideo, getMainVideoSrc, getOpenaiAnswer, IVideo } from './utils';
import SendSVG from './components/common/SendSVG';

/* 
1 - ¿Cómo puedo cuidar mi cuerpo?
2 - Hacen falta cosas en mi vida. ¿Cómo puedo solventarlo?
3 - Cómo puedo conseguir más dinero?
4 - Extraño mucho a mi Ex, quiero recuperarla.
*/

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
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [sendBtnDisabled, setSendBtnDisabled] = useState(true);

  useEffect(() => {
    chatContainer.current!.scrollTo({ top: Number.MAX_SAFE_INTEGER });
  }, [messages.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }

    if (debug()) {
      console.log('Video: ', videos.at(-1)?.src || getMainVideoSrc());
    }
  }, [videos.length]);

  async function onButtonClick(e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) {
    if (e.type === 'keydown' && (e as React.KeyboardEvent<HTMLInputElement>).code !== 'Enter') {
      return;
    }

    if (!inputRef) {
      return;
    }

    const question = inputRef.current!.value;

    if (question === '') {
      return;
    }

    if (debug()) {
      console.time('IA');
    }

    const regex = /Resultado:\s+([^\.]+)\./;
    const topicByChatGPT = (await getOpenaiAnswer(question))!
      .match(regex)![1] || 'Ninguno';


    if (debug()) {
      console.timeEnd('IA');
    }

    writeMessage(UserType.user, question);
    inputRef.current!.value = '';
    setSendBtnDisabled(true);

    if (debug()) {
      console.log('IA text:', topicByChatGPT);
    }

    /* @ts-ignore */
    setVideos([...videos, getAnswerByTopic(topicByChatGPT)]);
  }

  function writeMessage(userType: UserType, message: string) {
    setMessages([...messages, { userType, message }]);
  }

  function getMediaSrc() {
    return videos.at(0)?.src || getMainVideoSrc();
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
      if (!videos.at(0)?.video) {
        return;
      }

      /* @ts-ignore */
      const content = await getAnswerTextByVideo(videos.at(0)?.video);

      if (messages.at(-1)!.message === content.message) {
        return;
      }

      writeMessage(UserType.bot, content.message);
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
    <div className='app-main'>
      <Player
        className='avatar'
        onClick={onVideoClick}
        onDoubleClick={getNextVideo}
        onPlay={onVideoPlay}
        src={getMediaSrc()}
        onEnded={getNextVideo}
        preload='auto'
        cref={videoRef}
        autoPlay
      />
      <div className='chat-container'>
        <div className='chat-header'>
          <div className='chat-header-avatar'>
            J
          </div>
          <div className='chat-header-info'>
            <h3 className='chat-header-info-title'>John Doe</h3>
            <p className='chat-header-info-content'>last seen 2h ago</p>
          </div>
        </div>
        <div ref={chatContainer} className='chat-placeholder'>
          {
            messages.map((message, index) =>
              <div className={`chat-placeholder-bubble ${message.userType === UserType.bot ? 'bot' : 'user'}`} key={`${message}${index}`}>
                <p dangerouslySetInnerHTML={{ __html: message.message.replace(/\n/g, '<br />') }}></p>
              </div>
            )
          }
        </div>
        <div className='chat-actions'>
          <input
            ref={inputRef}
            type='text'
            className='chat-actions-input'
            placeholder='¡Tu pregunta aquí!'
            maxLength={1000}
            onKeyDown={onButtonClick}
            onChange={() => setSendBtnDisabled(!inputRef.current?.value)}
          />
          <button onClick={onButtonClick} type='button' className='chat-actions-send' disabled={sendBtnDisabled}><SendSVG /></button>
        </div>
      </div>
    </div>
  );
};

export default App;
