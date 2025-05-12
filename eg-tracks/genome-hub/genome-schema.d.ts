export declare const genomeDataSchema: {
    type: string;
    required: string[];
    properties: {
        id: {
            type: string;
        };
        name: {
            type: string;
        };
        group: {
            type: string;
        };
        chromosomes: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                    };
                    length: {
                        type: string;
                        minimum: number;
                    };
                };
            };
        };
        cytobands: {
            type: string;
            patternProperties: {
                "^chr([0-9]+|[XYM])$": {
                    type: string;
                    items: {
                        type: string;
                        required: string[];
                        properties: {
                            chrom: {
                                type: string;
                            };
                            chromStart: {
                                type: string;
                                minimum: number;
                            };
                            chromEnd: {
                                type: string;
                                minimum: number;
                            };
                            name: {
                                type: string;
                            };
                            gieStain: {
                                type: string;
                                enum: string[];
                            };
                        };
                    };
                };
            };
            additionalProperties: boolean;
        };
        defaultRegion: {
            type: string;
        };
        defaultTracks: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    type: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                    genome: {
                        type: string;
                    };
                    url: {
                        type: string;
                    };
                    options: {
                        type: string;
                    };
                    metadata: {
                        type: string;
                    };
                    label: {
                        type: string;
                    };
                    isSelected: {
                        type: string;
                    };
                    fileObj: {
                        type: string;
                    };
                    files: {
                        type: string;
                    };
                    tracks: {
                        type: string;
                    };
                    isText: {
                        type: string;
                    };
                    textConfig: {
                        type: string;
                    };
                    apiConfig: {
                        type: string;
                    };
                    queryEndpoint: {
                        type: string;
                    };
                };
            };
        };
        publicHubList: {
            type: string;
            items: {
                type: string;
                required: string[];
                properties: {
                    collection: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                    numTracks: {
                        type: string;
                        minimum: number;
                    };
                    oldHubFormat: {
                        type: string;
                    };
                    url: {
                        type: string;
                    };
                    description: {
                        oneOf: {
                            type: string;
                        }[];
                    };
                };
            };
        };
        publicHubData: {
            type: string;
        };
        annotationTracks: {
            type: string;
            properties: {
                Ruler: {
                    type: string;
                };
                Genes: {
                    type: string;
                };
                'Transcription Factor': {
                    type: string;
                };
                Variation: {
                    type: string;
                };
                RepeatMasker: {
                    type: string;
                };
                Conservation: {
                    type: string;
                };
                'Genome Annotation': {
                    type: string;
                };
                'Genome Comparison': {
                    type: string;
                };
                Mappability: {
                    type: string;
                };
            };
        };
        twoBitURL: {
            type: string;
        };
    };
    additionalProperties: boolean;
};
export declare function validateGenomeData(data: any): {
    valid: boolean;
    errors: any;
} | {
    valid: boolean;
    errors?: undefined;
};
