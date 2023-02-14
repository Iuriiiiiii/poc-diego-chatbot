import { MouseEventHandler, useEffect, useRef, useState } from 'react';
import './App.scss';
import { Synthesia, SynthesiaCreateVideo, SynthesiaGetVideo, Input, InputConfig, SynthesiaVideoResponse } from '../lib/synthesia';
import { AxiosResponse } from 'axios';
import mainVideo from '/main.mp4';
import Player from './components/Player';
import { Configuration, OpenAIApi } from 'openai';

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

    console.log('Video: ', videos.at(0) || mainVideo);
  }, [videos.length]);

  async function getOpenaiAnswer(text: string) {
    const configuration = new Configuration({
      apiKey: import.meta.env.VITE_OPENAI_SECRET_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const header = 'Answer in less of 800 characters and without code examples: ';

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: header + text,
      temperature: 0.6,
      max_tokens: 1000
    });

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
    const chatGPTAnswer = (await getOpenaiAnswer(question))!;
    console.timeEnd('OpenAI');
    console.log('End question');
    inputTextRef.current!.value = '';
    // setMessages([...messages, chatGPTAnswer]);
    // chatContainer.current!.scrollTop = chatContainer.current!.scrollHeight;

    console.log(chatGPTAnswer);

    console.time("Synthesia");
    getSynthesiaVideo(chatGPTAnswer, (response) => {
      setMessages([...messages, chatGPTAnswer]);
      setVideos([...videos, response.download!]);
      console.log(response.download);
      console.timeEnd("Synthesia");
    });
    // pushVideo('https://synthesia-ttv-data.s3.amazonaws.com/video_data/ac551166-72c8-462d-a062-8faab059bc36/transfers/target_transfer.mp4?response-content-disposition=attachment%3Bfilename%3D%22Synthesia%20video%20-%20ac5511.mp4%22&AWSAccessKeyId=ASIA32NGJ5TS6MSQ7ADN&Signature=D54KVOa%2FEgoAQ1u4rIal%2BR0J2zw%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEFIaCWV1LXdlc3QtMSJHMEUCIQDIBCPCWiP8dIsOhlZOom7rk4xAgjhhOD1a6pZtI0E4zwIgDDKSMYMGssgE3i17ZE%2Bh28qO03u8hqN1DDXdSGkVw2oqlgMI2%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARACGgw4MTI2MzQ0Njc1NTciDFk69B5UzrdpaAXqPCrqAgOlAFP2anOk%2FaqwpFCSLZ70NcuEzfY08Uh1ajrknyKhD43gGoKSIduJlZRJpJjLSDXji6xbU9fYbBgtRV%2BKq%2Bq1UjqrE70yI8FRHsX8fpp25wXV6j2MRUp90HtUpxiwXCtGOKXkQlUAXGo4de1zPRlYVuLowLL0wPxoGtCuh3fvYJEcqlyBaAy%2FZhrMvDBu28vFUBtgEpWDHfUDFG%2FaEceAOXr6591XxQowe5QyMdqAxvojk3a0Rqu7OKIjcCxMoR9rc6umPJ2UHD6HPspCctYju5hkbAjvvFpIVWPu1t9yERyLTi%2BmdA%2BmKM4WlvNwWx9omemVdDwIfv47nXohxOOkf7RcZ1Hyc8B8HEel257WXjWdjobYQsR5p8BgiMmAHAf0WiL3Ofu3qHP3QSY%2BG81OpXKIF9jR61KQ4j6m%2FOaw3hjocoX8si3AOiZsjBBWZhzen9rWi5NT7VHGYXelbNjMSixn%2BWMm%2FsfZMJHOpJ8GOp0BaqfXFDGSzrd1vH3sZvSUVCbFZJkden7ggK9U1zeFtmQnRuDhY69SCbiGDuhsXQcjDokZFjTVhEOTwOt58879Y1tX3IcQoX1mdnCleQUNWUgIJ%2B1%2Fr0p9lT4%2BajFn00MfVGLhiNYuXF6YrFZEmW4%2Bu5XLMTLd0qxUa87Kk%2FIU7VpCf7eChVOxi0LkIAYMAaiqN9OgN87hTSr1dcfdiQ%3D%3D&Expires=1676246085');
  }

  function pushVideo(url: string) {
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
    <div className='flex justify-center items-center w-screen h-screen bg-[#E1B6B6]'>
      <Player cref={videoContainer} onClick={playVideo} className='w-full h-screen' src={videos.at(0) || mainVideo} onEnded={onVideoEnd} autoPlay />
      <div className='flex flex-col space-y-2 w-4/6 absolute bottom-2 drop-shadow-2xl opacity-80'>
        <div ref={chatContainer} className='flex flex-col space-y-2 h-32 w-full text-white bg-pink-800 overflow-y-scroll p-3'>
          {messages.map((message, index) => <span key={`${message}${index}`}>{message}</span>)}
        </div>
        <input ref={inputTextRef} type='text' className='bg-pink-800 px-3 text-white' placeholder='Your question here!' maxLength={200} />
        <button onClick={clickHandler} type='button' className='bg-pink-800 text-white w-full'>Send</button>
      </div>
    </div>
  );
};

export default App;
