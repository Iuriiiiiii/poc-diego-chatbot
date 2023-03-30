import React, { useContext, useEffect, useRef, useState } from "react";
import "./App.scss";
import Player from "./components/Player";
import {
  debug,
  getAnswerByTopic,
  getAnswerTextByVideo,
  getMainVideoSrc,
  getOpenaiAnswer,
  IVideo,
  isVideoPlaying,
} from "./utils";
import SendSVG from "./components/common/SendSVG";
import santa from "/santa.png";
import { IVideoContext, VideoStatus } from "./interfaces";
import { VideoContext } from "./contexts";

const enum UserType {
  bot,
  user,
}

interface MessageType {
  userType: UserType;
  message: string;
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainer = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  /* filo stack */
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [sendBtnDisabled, setSendBtnDisabled] = useState(false);
  const [context, setContext] = useState<VideoStatus>(VideoStatus.stopped);
  const providerValue: IVideoContext = {
    status: context,
    setStatus: setContext,
  };

  useEffect(() => {
    chatContainer.current!.scrollTo({ top: Number.MAX_SAFE_INTEGER });
  }, [messages.length]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }

    if (debug()) {
      console.log("Video: ", videos.at(-1)?.src || getMainVideoSrc());
    }
  }, [videos.length]);

  // useEffect(() => {
  //   setSendBtnDisabled(context === VideoStatus.playing);
  // }, [context, inputRef.current?.innerText.length]);

  async function onButtonClick(
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      e.type === "keydown" &&
      (e as React.KeyboardEvent<HTMLInputElement>).code !== "Enter"
    ) {
      return;
    }
    // console.log(sendBtnDisabled);
    if (sendBtnDisabled) {
      return;
    }

    if (!inputRef) {
      return;
    }

    const question = inputRef.current!.value;

    if (question === "") {
      return;
    }

    if (debug()) {
      console.time("IA");
    }

    const regex = /Resultado:\s+([^\.]+)\./;
    const aiAnswer = (await getOpenaiAnswer(question))!;
    let topicByChatGPT: string;

    if (import.meta.env.VITE_AI_MODEL === "text-davinci-002") {
      topicByChatGPT = aiAnswer!.split("\n\n")[1] || "Ninguno";
    } else {
      topicByChatGPT = aiAnswer.match(regex)![1] || "Ninguno";
    }

    if (debug()) {
      console.timeEnd("IA");
    }

    writeMessage(UserType.user, question);
    inputRef.current!.value = "";
    // setSendBtnDisabled(true);

    if (debug()) {
      console.log("IA text:", topicByChatGPT);
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

  function getLastBotMessage() {
    return [...messages]
      .reverse()
      .find((message) => message.userType == UserType.bot);
  }

  async function onVideoPlay(e: React.SyntheticEvent<HTMLVideoElement>) {
    try {
      setContext(VideoStatus.playing);

      if (!videos.at(0)?.video) {
        return;
      }

      /* @ts-ignore */
      const content = await getAnswerTextByVideo(videos.at(0)?.video);
      const lastBotMessage = getLastBotMessage();
      console.log(lastBotMessage?.message, "-------------", content.message);

      if (lastBotMessage?.message === content.message) {
        return;
      }

      writeMessage(UserType.bot, content.message);
    } catch (e) {}
  }

  function getNextVideo() {
    setContext(VideoStatus.stopped);

    if (videos.length === 0) {
      return;
    }

    const video = videos.shift()!;
    setVideos([...videos]);
  }

  function onVideoPause() {
    setContext(VideoStatus.paused);
  }

  return (
    <VideoContext.Provider value={providerValue}>
      <div className="app-main">
        <img className="loading" src={santa} title="santa" />
        <Player
          className="avatar"
          onClick={onVideoClick}
          onDoubleClick={getNextVideo}
          onPlay={onVideoPlay}
          onPause={onVideoPause}
          src={getMediaSrc()}
          onEnded={getNextVideo}
          preload="auto"
          cref={videoRef}
          autoPlay
        />
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-header-avatar">J</div>
            <div className="chat-header-info">
              <h3 className="chat-header-info-title">John Doe</h3>
              <p className="chat-header-info-content">last seen 2h ago</p>
            </div>
          </div>
          <div ref={chatContainer} className="chat-placeholder">
            {messages.map((message, index) => (
              <div
                className={`chat-placeholder-bubble ${
                  message.userType === UserType.bot ? "bot" : "user"
                }`}
                key={`${message}${index}`}
              >
                <p
                  dangerouslySetInnerHTML={{
                    __html: message.message.replace(/\n/g, "<br />"),
                  }}
                ></p>
              </div>
            ))}
          </div>
          <div className="chat-actions">
            <input
              ref={inputRef}
              type="text"
              className="chat-actions-input"
              placeholder="¡Tu pregunta aquí!"
              maxLength={1000}
              onKeyDown={onButtonClick}
            />
            <button
              onClick={onButtonClick}
              type="button"
              className="chat-actions-send"
              disabled={sendBtnDisabled}
            >
              <SendSVG />
            </button>
          </div>
        </div>
      </div>
    </VideoContext.Provider>
  );
}

export default App;
