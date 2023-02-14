import axios, { AxiosInstance } from 'axios';

export interface SynthesiaVideoResponse {
    createdAt: number,
    id: string,
    lastUpdatedAt: number,
    status: 'in_progress' | 'complete',
    visibility: string,
    download?: string,
    duration?: string;
}

// export interface SynthesiaGetVideoResponse extends SynthesiaVideoResponse {

// }

export interface SynthesiaConfig {
    token: string,
    test?: boolean,
    title?: string,
    description?: string,
    visibility?: "private" | "public" | string,
    ctaSettings?: {
        label?: string,
        url?: string,
        callbackId?: string;
    };
}

type InputBackgroundTransparent = "green_screen";
type InputBackgroundSolid = "off_white" | "warm_white" | "light_pink" | "light_pink" | "light_blue" | "light_blue" | "soft_cyan" | "strong_cyan" | "light_orange" | "soft_orange";
type InputBackgroundImage = "white_studio" | "white_studio" | "luxury_lobby" | "large_window" | "large_window" | "large_window";

export interface InputConfig {
    /**
     * See: https://docs.synthesia.io/reference/avatars
     */
    avatar?: string,
    background?: InputBackgroundTransparent | InputBackgroundSolid | InputBackgroundImage | string,
    scriptText?: string,
    audio?: string,
    InputConfig?: string,
    avatarSettings?: {
        /**
         * See: https://docs.synthesia.io/reference/voices
         */
        voice?: string,
        horizontalAlign?: "left" | "center" | "right" | string,
        scale?: number,
        style?: "rectangular" | "circular" | string,
        backgroundColor?: string,
        seamless?: boolean,
    },
    backgroundSettings?: {
        videoSettings?: {
            shortBackgroundContentMatchMode?: "freeze" | "loop" | "slow_down" | string,
            longBackgroundContentMatchMode?: "trim" | "speed_up";
        };
    },
    /**
     * @deprecated
     * Create a video from template instead.
     */
    soundtrack?: "corporate" | "inspirational" | "modern" | "urban",
}

export class Input {
    private config: InputConfig;
    constructor(config: InputConfig) {
        config.scriptText || config.audio || new Error('"scriptText" or "audio" expected.');
        config.avatar ||= "isabella_costume1_cameraA";
        config.background ||= "light_pink";
        this.config = config;
    }

    getInput() {
        return this.config;
    }
}

export class SynthesiaCreateVideo {
    private inputs: Input[];
    constructor(inputs: Input[]) {
        inputs.length > 0 || new Error("At least 1 input expected.");
        this.inputs = inputs;
    }

    getInputs() {
        return this.inputs.map(input => input.getInput());
    }
}

export class SynthesiaGetVideo {
    private id: string;

    constructor(id: string) {
        this.id = id;
    }

    getId() {
        return this.id;
    }
}

const SYNTHESIA_ENDPOINT = "https://api.synthesia.io/v2";

export class Synthesia {
    private cfg: SynthesiaConfig;
    private axios: AxiosInstance;

    constructor(config: SynthesiaConfig) {
        config.token ?? new Error("Token expected.");
        config.test ||= true;
        this.cfg = config;
        this.axios = axios.create({
            headers: {
                Authorization: this.cfg.token
            }
        });
    }

    request(method: SynthesiaCreateVideo | SynthesiaGetVideo) {
        console.log(method);
        if (method instanceof SynthesiaCreateVideo) {
            const data = {
                ...this.cfg,
                input: method.getInputs(),
                test: this.cfg.test,
                // test: undefined,
            };

            delete data.test;

            return this.axios.post<SynthesiaVideoResponse>(`${SYNTHESIA_ENDPOINT}/videos`, data);
        }

        if (method instanceof SynthesiaGetVideo) {
            return this.axios.get<SynthesiaVideoResponse>(`${SYNTHESIA_ENDPOINT}/videos/${method.getId()}`);
        }

        return Promise.reject("Invalid method");
    }
}

// const TOKEN = '116e302f3fa64abf6d2b210deef4d50a';

// const synthesia = new Synthesia({
//     token: TOKEN,
//     test: false
// });

// const inputs = [
//     new Input({
//         scriptText: "Hi, my name is Alexander, i work for WebtronicLabs.",
//     })
// ];

// let req = await synthesia.request(new SynthesiaCreateVideo(inputs));

// {
//     createdAt: 1675725232,
//     id: "47bf6b05-451a-4936-abbc-5acad9f2bb5a",
//     lastUpdatedAt: 1675725232,
//     status: "in_progress",
//     visibility: "private"
//   }

// console.log(req.data);

// let req = await synthesia.request(new SynthesiaGetVideo("5b6a4dc2-d3a1-4de9-af88-77bbe562714c"));

// console.log(req.data);
