import React, { useState } from 'react';

type IntrinsicAttributes = React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
interface Props { src: string, cref?: IntrinsicAttributes['ref']; }

const Player = (props: Props & IntrinsicAttributes) => {
    return (
        <>
            <video key={props.src} ref={props.cref} {...{ ...props, src: undefined }}>
                <source src={props.src} type='video/mp4'></source>
                Tu navegador no soporta vídeos...
            </video>
        </>
    );
};

export default Player;