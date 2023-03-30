import React from "react";
import { IVideoContext } from "../interfaces";

export const defaultContext: IVideoContext = { playing: false };
export const VideoContext = React.createContext<IVideoContext>(defaultContext);
