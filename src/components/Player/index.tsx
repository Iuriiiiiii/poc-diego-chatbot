import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import playButton from "/play-button.png";
import stopButton from "/stop-button.png";
import pauseButton from "/pause-button.png";
import { IVideoContext, VideoStatus } from "../../interfaces";
import { VideoContext } from "../../contexts";

type IntrinsicAttributes = React.DetailedHTMLProps<
  React.VideoHTMLAttributes<HTMLVideoElement>,
  HTMLVideoElement
>;
interface Props {
  src: string;
  cref?: React.RefObject<HTMLVideoElement>;
}

const Player = (props: Props & IntrinsicAttributes) => {
  const [drawButtons, setDrawButtons] = useState<boolean>(true);

  useEffect(() => setDrawButtons(true), [props.cref]);

  function Buttons() {
    const ref = props.cref!;
    const { status } = useContext<IVideoContext>(VideoContext);

    console.log(status);

    return (
      <div className="absolute top-5 left-3 z-40">
        <button
          className="hover:scale-105"
          type="button"
          /* @ts-ignore */
          onClick={() => props.onClick!({ currentTarget: ref.current! })}
        >
          <img
            src={status === VideoStatus.playing ? pauseButton : playButton}
          />
        </button>

        {status !== VideoStatus.stopped && (
          <button
            className="hover:scale-105"
            type="button"
            // @ts-ignore
            onClick={props.onDoubleClick}
          >
            <img src={stopButton} />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {drawButtons ? <Buttons /> : null}
      <video key={props.src} ref={props.cref} {...{ ...props, src: undefined }}>
        <source src={props.src} type="video/mp4"></source>
        Tu navegador no soporta vídeos...
      </video>
    </>
  );
};

export default Player;
