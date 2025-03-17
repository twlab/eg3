// import Ajv from 'ajv';

export const genomeDataSchema = {
    type: 'object',
    required: ['name', 'id', 'chromosomes'],
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        group: { type: 'string' },
        chromosomes: {
            type: 'array',
            items: {
                type: 'object',
                required: ['name', 'length'],
                properties: {
                    name: { type: 'string' },
                    length: { type: 'integer', minimum: 1 }
                }
            }
        },
        cytobands: {
            type: 'object',
            patternProperties: {
                "^chr([0-9]+|[XYM])$": {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['chrom', 'chromStart', 'chromEnd', 'name', 'gieStain'],
                        properties: {
                            chrom: { type: 'string' },
                            chromStart: { type: 'integer', minimum: 0 },
                            chromEnd: { type: 'integer', minimum: 1 },
                            name: { type: 'string' },
                            gieStain: {
                                type: 'string',
                                enum: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'acen', 'gvar', 'stalk']
                            }
                        }
                    }
                }
            },
            additionalProperties: false
        },
        defaultRegion: { type: 'string' },
        defaultTracks: {
            type: 'array',
            items: {
                type: 'object',
                required: ['type', 'name'],
                properties: {
                    type: { type: 'string' },
                    name: { type: 'string' },
                    genome: { type: 'string' },
                    url: { type: 'string' },
                    options: { type: 'object' },
                    metadata: { type: 'object' },
                    label: { type: 'string' },
                    isSelected: { type: 'boolean' },
                    fileObj: { type: 'string' },
                    files: { type: 'array' },
                    tracks: { type: 'array' },
                    isText: { type: 'boolean' },
                    textConfig: { type: 'object' },
                    apiConfig: { type: 'object' },
                    queryEndpoint: { type: 'object' }
                }
            }
        },
        publicHubList: {
            type: 'array',
            items: {
                type: 'object',
                required: ['collection', 'name', 'numTracks', 'url'],
                properties: {
                    collection: { type: 'string' },
                    name: { type: 'string' },
                    numTracks: { type: 'integer', minimum: 0 },
                    oldHubFormat: { type: 'boolean' },
                    url: { type: 'string' },
                    description: {
                        oneOf: [
                            { type: 'string' },
                            { type: 'object' }
                        ]
                    }
                }
            }
        },
        publicHubData: { type: 'object' },
        annotationTracks: {
            type: 'object',
            properties: {
                Ruler: { type: 'array' },
                Genes: { type: 'array' },
                'Transcription Factor': { type: 'array' },
                Variation: { type: 'array' },
                RepeatMasker: { type: 'object' },
                Conservation: { type: 'array' },
                'Genome Annotation': { type: 'array' },
                'Genome Comparison': { type: 'array' },
                Mappability: { type: 'array' }
            }
        },
        twoBitURL: { type: 'string' }
    }
};

export function validateGenomeData(data: any) {

    return { valid: true };
    // const ajv = new Ajv({ allErrors: true });
    // const validate = ajv.compile(genomeDataSchema);
    // const valid = validate(data);

    // if (!valid) {
    //     return {
    //         valid: false,
    //         errors: validate.errors
    //     };
    // }

    // return { valid: true };
}
