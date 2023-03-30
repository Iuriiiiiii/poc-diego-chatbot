import { Dispatch, SetStateAction } from "react";

export enum VideoStatus {
  playing,
  paused,
  stopped,
}

export interface IVideoContext {
  status: VideoStatus;
  setStatus: Dispatch<SetStateAction<VideoStatus>>;
}
