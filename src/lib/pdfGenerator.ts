import * as pdfMake from 'pdfmake/build/pdfmake';
import type { RPHRecord } from '../types';
import { processJawi, processJawiArray } from './jawiUtils';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

// Font configuration
const fonts: TFontDictionary = {
    NotoSansArabic: {
        normal: `${window.location.origin}/fonts/NotoSansArabic-Regular.ttf`,
        bold: `${window.location.origin}/fonts/NotoSansArabic-Bold.ttf`,
    }
};

/**
 * Generates a PDF for a single RPH record using pdfmake.
 * Returns the PDF as a Blob.
 * 
 * @param record The RPH record to generate.
 */
export const generateRPH_PDF = async (record: RPHRecord): Promise<Blob> => {
    const docDefinition = createRPHDocDefinition(record);
    
    return new Promise((resolve) => {
        // @ts-expect-error - pdfmake type mismatch in library build
        const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts);
        // @ts-expect-error - pdfmake type mismatch in library build
        pdfDoc.getBlob((blob: Blob) => {
            resolve(blob);
        });
    });
};

/**
 * Generates a bulk PDF for multiple RPH records.
 * Returns the PDF as a Blob.
 * 
 * @param records Array of RPH records.
 */
export const generateBulkRPH_PDF = async (records: RPHRecord[]): Promise<Blob> => {
    if (records.length === 0) throw new Error('No records to generate PDF');

    const content: unknown[] = [];
    
    for (let i = 0; i < records.length; i++) {
        const recordContent = createRPHDocDefinition(records[i]).content;
        if (recordContent) {
            if (Array.isArray(recordContent)) {
                content.push(...recordContent);
            } else {
                content.push(recordContent);
            }
        }
        
        if (i < records.length - 1) {
            content.push({ text: '', pageBreak: 'after' });
        }
    }

    const docDefinition: TDocumentDefinitions = {
        // @ts-expect-error - pdfmake Content type is highly complex
        content,
        defaultStyle: {
            font: 'NotoSansArabic',
            fontSize: 10,
        },
        styles: getStyles(),
        pageMargins: [40, 40, 40, 40],
    };

    return new Promise((resolve) => {
        // @ts-expect-error - pdfmake type mismatch in library build
        const pdfDoc = pdfMake.createPdf(docDefinition, undefined, fonts);
        // @ts-expect-error - pdfmake type mismatch in library build
        pdfDoc.getBlob((blob: Blob) => {
            resolve(blob);
        });
    });
};

function getStyles() {
    return {
        header: {
            fontSize: 14,
            bold: true,
            alignment: 'center' as const,
            margin: [0, 0, 0, 5] as [number, number, number, number]
        },
        subheader: {
            fontSize: 12,
            bold: true,
            alignment: 'center' as const,
            margin: [0, 0, 0, 10] as [number, number, number, number]
        },
        label: {
            bold: true,
            fillColor: '#f8fafc',
            margin: [5, 5, 5, 5] as [number, number, number, number]
        },
        cell: {
            margin: [5, 5, 5, 5] as [number, number, number, number]
        },
        jawiText: {
            fontSize: 11,
            lineHeight: 1.4,
            alignment: 'right' as const
        }
    };
}

/**
 * Internal helper to create the document definition for a single RPH.
 */
function createRPHDocDefinition(record: RPHRecord): TDocumentDefinitions {
    const subjek = processJawi(record.subjek);
    const bidang = processJawi(record.content?.bidang);
    const sk = processJawi(record.content?.tajukStandardKandungan);
    const sp = processJawiArray(record.content?.sp);
    const objektif = processJawi(record.content?.objektif);
    const aktiviti = processJawi(record.content?.aktiviti);
    const refleksi = processJawi(record.content?.refleksi);

    return {
        content: [
            {
                columns: [
                    {
                        image: `${window.location.origin}/logo.png`,
                        width: 50,
                        margin: [0, 0, 10, 0]
                    },
                    {
                        stack: [
                            { text: 'SEKOLAH RENDAH ISLAM AL-KHAIRIAH', style: 'header', alignment: 'left' },
                            { text: 'REKOD PENGAJARAN HARIAN', style: 'subheader', alignment: 'left' },
                        ],
                        width: '*'
                    }
                ],
                margin: [0, 0, 0, 15]
            },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        [
                            { text: 'TARIKH', bold: true, fillColor: '#f1f5f9' }, record.tarikh,
                            { text: 'HARI', bold: true, fillColor: '#f1f5f9' }, record.hari,
                        ],
                        [
                            { text: 'KELAS', bold: true, fillColor: '#f1f5f9' }, record.kelas,
                            { text: 'MASA', bold: true, fillColor: '#f1f5f9' }, record.masa,
                        ]
                    ]
                },
                margin: [0, 0, 0, 10]
            },
            {
                table: {
                    widths: [120, '*'],
                    body: [
                        [{ text: 'SUBJEK', style: 'label' }, { text: subjek, style: ['cell', 'jawiText'] }],
                        bidang ? [{ text: 'BIDANG', style: 'label' }, { text: bidang, style: ['cell', 'jawiText'] }] : [],
                        [{ text: 'TAJUK / SK', style: 'label' }, { text: sk, style: ['cell', 'jawiText'] }],
                        [
                            { text: 'STANDARD\nPEMBELAJARAN (SP)', style: 'label' },
                            {
                                ul: sp.map(s => ({ text: s, alignment: 'right' })),
                                style: 'cell'
                            }
                        ],
                        record.content?.spi && record.content.spi.length > 0 ? [
                            { text: 'STANDARD\nPRESTASI (SPI)', style: 'label' },
                            {
                                ul: record.content.spi.map(s => ({
                                    text: [
                                        { text: `TP${s.tp}: `, bold: true },
                                        { text: processJawi(s.desc) }
                                    ],
                                    alignment: 'right'
                                })),
                                style: 'cell'
                            }
                        ] : [],
                        [{ text: 'OBJEKTIF', style: 'label' }, { text: objektif, style: ['cell', 'jawiText'] }],
                        [{ text: 'AKTIVITI', style: 'label' }, { text: aktiviti, style: ['cell', 'jawiText'] }],
                        [{ text: 'REFLEKSI', style: 'label' }, { text: refleksi || '-', style: ['cell', 'jawiText'] }]
                    ].filter(row => row.length > 0)
                },
                margin: [0, 0, 0, 20]
            },
            {
                columns: [
                    {
                        stack: [
                            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }] },
                            { text: 'Tandatangan Guru', fontSize: 8, margin: [0, 5, 0, 0], alignment: 'center' }
                        ],
                        width: 150,
                        alignment: 'center'
                    },
                    { text: '', width: '*' },
                    {
                        stack: [
                            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 0.5 }] },
                            { text: 'Guru Besar/PK', fontSize: 8, margin: [0, 5, 0, 0], alignment: 'center' }
                        ],
                        width: 150,
                        alignment: 'center'
                    }
                ],
                margin: [0, 20, 0, 0]
            }
        ],
        defaultStyle: {
            font: 'NotoSansArabic',
            fontSize: 10,
        },
        styles: getStyles(),
        pageMargins: [40, 40, 40, 40],
    };
}
