import React from "react";
import { IVideoContext, VideoStatus } from "../interfaces";

export const defaultContext: IVideoContext = {
  status: VideoStatus.stopped,
  setStatus: () => {},
};
export const VideoContext = React.createContext<IVideoContext>(defaultContext);
