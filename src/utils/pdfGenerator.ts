import { jsPDF } from 'jspdf';
import type { RPHRecord } from '../types';
import { AmiriBase64 } from './fonts/amiriFont';
// @ts-ignore
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Professional Arabic/Jawi Reshaper
 */
const JawiMap: Record<number, [number, number, number, number]> = {
    0x0621: [0xFE80, 0xFE80, 0xFE80, 0xFE80], // HAMZA
    0x0622: [0xFE81, 0xFE81, 0xFE82, 0xFE82], // ALEF_MADDA
    0x0623: [0xFE83, 0xFE83, 0xFE84, 0xFE84], // ALEF_HAMZA_ABOVE
    0x0624: [0xFE85, 0xFE85, 0xFE86, 0xFE86], // WAW_HAMZA
    0x0625: [0xFE87, 0xFE87, 0xFE88, 0xFE88], // ALEF_HAMZA_BELOW
    0x0626: [0xFE89, 0xFE8B, 0xFE8C, 0xFE8A], // YEH_HAMZA
    0x0627: [0xFE8D, 0xFE8D, 0xFE8E, 0xFE8E], // ALEF
    0x0628: [0xFE8F, 0xFE91, 0xFE92, 0xFE90], // BEH
    0x0629: [0xFE93, 0xFE93, 0xFE94, 0xFE94], // TEH_MARBUTA
    0x062A: [0xFE95, 0xFE97, 0xFE98, 0xFE96], // TEH
    0x062B: [0xFE99, 0xFE9B, 0xFE9C, 0xFE9A], // THEH
    0x062C: [0xFE9D, 0xFE9F, 0xFEA0, 0xFE9E], // JEEM
    0x062D: [0xFEA1, 0xFEA3, 0xFEA4, 0xFEA2], // HAH
    0x062E: [0xFEA5, 0xFEA7, 0xFEA8, 0xFEA6], // KHAH
    0x062F: [0xFEA9, 0xFEA9, 0xFEAA, 0xFEAA], // DAL
    0x0630: [0xFEAB, 0xFEAB, 0xFEAC, 0xFEAC], // THAL
    0x0631: [0xFEAD, 0xFEAD, 0xFEAE, 0xFEAE], // REH
    0x0632: [0xFEAF, 0xFEAF, 0xFEB0, 0xFEB0], // ZAIN
    0x0633: [0xFEB1, 0xFEB3, 0xFEB4, 0xFEB2], // SEEN
    0x0634: [0xFEB5, 0xFEB7, 0xFEB8, 0xFEB6], // SHEEN
    0x0635: [0xFEB9, 0xFEBB, 0xFEBC, 0xFEBA], // SAD
    0x0636: [0xFEBD, 0xFEBF, 0xFEC0, 0xFEBE], // DAD
    0x0637: [0xFEC1, 0xFEC3, 0xFEC4, 0xFEC2], // TAH
    0x0638: [0xFEC5, 0xFEC7, 0xFEC8, 0xFEC6], // ZAH
    0x0639: [0xFEC9, 0xFECB, 0xFECC, 0xFECA], // AIN
    0x063A: [0xFECD, 0xFECF, 0xFED0, 0xFECE], // GHAIN
    0x0641: [0xFED1, 0xFED3, 0xFED4, 0xFED2], // FEH
    0x0642: [0xFED5, 0xFED7, 0xFED8, 0xFED6], // QAF
    0x0643: [0xFED9, 0xFEDB, 0xFEDC, 0xFEDA], // KAF
    0x0644: [0xFEDD, 0xFEDF, 0xFEE0, 0xFEDE], // LAM
    0x0645: [0xFEE1, 0xFEE3, 0xFEE4, 0xFEE2], // MEEM
    0x0646: [0xFEE5, 0xFEE7, 0xFEE8, 0xFEE6], // NOON
    0x0647: [0xFEE9, 0xFEEB, 0xFEEC, 0xFEEA], // HEH
    0x0648: [0xFEED, 0xFEED, 0xFEEE, 0xFEEE], // WAW
    0x0649: [0xFEEF, 0xFEEF, 0xFEF0, 0xFEF0], // ALEF_MAKSURA
    0x064A: [0xFEF1, 0xFEF3, 0xFEF4, 0xFEF2], // YEH
    // Jawi/Persian Extensions
    0x067E: [0xFB56, 0xFB58, 0xFB59, 0xFB57], // PEH (Jawi Pa)
    0x0686: [0xFB7A, 0xFB7C, 0xFB7D, 0xFB7B], // TCHEH (Jawi Ca)
    0x06A9: [0xFB8E, 0xFB90, 0xFB91, 0xFB8F], // KEHEH (Persian/Jawi Kaf)
    0x06AF: [0xFB92, 0xFB94, 0xFB95, 0xFB93], // GAF (Used for Ga in Persian)
    0x06AC: [0xFB92, 0xFB94, 0xFB95, 0xFB93], // Jawi GA (U+06AC)
    0x06A2: [0xFB92, 0xFB94, 0xFB95, 0xFB93], // Jawi GA (Alternative)
    0x06A0: [0xFB9C, 0xFB9E, 0xFB9F, 0xFB9D], // NGA
    0x06AD: [0xFB9C, 0xFB9E, 0xFB9F, 0xFB9D], // NGA (Alternative)
    0x06BD: [0xFBA4, 0xFBA8, 0xFBA9, 0xFBA5], // NYA
    0x06CC: [0xFBAE, 0xFBB0, 0xFBB1, 0xFBAF], // FARSI YEH
};

const transChars = [
    0x0610, 0x0612, 0x0613, 0x0614, 0x0615, 0x064B, 0x064C, 0x064D, 0x064E, 0x064F,
    0x0650, 0x0651, 0x0652, 0x0653, 0x0654, 0x0655, 0x0656, 0x0657, 0x0658, 0x0670,
    0x06D6, 0x06D7, 0x06D8, 0x06D9, 0x06DA, 0x06DB, 0x06DC, 0x06DF, 0x06E0, 0x06E1,
    0x06E2, 0x06E3, 0x06E4, 0x06E7, 0x06E8, 0x06EA, 0x06EB, 0x06EC, 0x06ED,
];

function isTransparent(c: number): boolean {
    return transChars.includes(c);
}

function getNeighbor(text: string, index: number, direction: 1 | -1): number | null {
    let i = index + direction;
    while (i >= 0 && i < text.length) {
        const c = text.charCodeAt(i);
        if (!isTransparent(c)) return c;
        i += direction;
    }
    return null;
}

function connectsToPrev(char: number): boolean {
    const forms = JawiMap[char];
    if (!forms) return false;
    return forms[3] !== forms[0] || forms[2] !== forms[1];
}

function connectsToNext(char: number): boolean {
    const forms = JawiMap[char];
    if (!forms) return false;
    return forms[1] !== forms[0] || forms[2] !== forms[3];
}

function isArabicChar(c: number): boolean {
    return (c >= 0x0600 && c <= 0x06FF) || (c >= 0xFB50 && c <= 0xFEFF);
}

function isArabicLine(text: string): boolean {
    if (!text) return false;
    let count = 0;
    const clean = text.replace(/\s/g, '');
    if (!clean) return false;
    for (const char of clean) if (isArabicChar(char.charCodeAt(0))) count++;
    return count > 0;
}

function reshapeBlock(text: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const current = text.charCodeAt(i);
        if (isTransparent(current)) {
            result += text[i];
            continue;
        }
        // Ligatures
        if (current === 0x0644 && i < text.length - 1) {
            const next = getNeighbor(text, i, 1);
            let ligature = null;
            if (next === 0x0622) ligature = [0xFEF5, 0xFEF6];
            else if (next === 0x0623) ligature = [0xFEF7, 0xFEF8];
            else if (next === 0x0625) ligature = [0xFEF9, 0xFEFA];
            else if (next === 0x0627) ligature = [0xFEFB, 0xFEFC];
            if (ligature) {
                const prev = getNeighbor(text, i, -1);
                const canPrev = prev && connectsToNext(prev);
                result += String.fromCharCode(canPrev ? ligature[1] : ligature[0]);
                let j = i + 1;
                while (j < text.length && text.charCodeAt(j) !== next) {
                    result += text[j]; j++;
                }
                i = j; continue;
            }
        }
        const forms = JawiMap[current];
        if (forms) {
            const prev = getNeighbor(text, i, -1);
            const next = getNeighbor(text, i, 1);
            const canPrev = prev && connectsToNext(prev);
            const canNext = next && connectsToPrev(next);
            if (canPrev && canNext) result += String.fromCharCode(forms[2]);
            else if (canPrev) result += String.fromCharCode(forms[3]);
            else if (canNext) result += String.fromCharCode(forms[1]);
            else result += String.fromCharCode(forms[0]);
        } else {
            result += text[i];
        }
    }
    return result;
}

function reshapeArabic(text: string): string {
    if (!text) return '';
    const reshaped = reshapeBlock(text);
    try {
        const levels = bidi.getEmbeddingLevels(reshaped, 'rtl');
        return bidi.getReorderedString(reshaped, levels);
    } catch {
        return Array.from(reshaped).reverse().join('');
    }
}

function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
    if (!text) return ['-'];
    return doc.splitTextToSize(text, maxWidth);
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const TEXT_COLOR = '#000000';
const LABEL_COLOR = '#000000';

function initDocument(): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.addFileToVFS('Amiri-Regular.ttf', AmiriBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    return doc;
}

async function drawHeader(doc: jsPDF): Promise<number> {
    let y = MARGIN_TOP;
    try {
        const res = await fetch('/logo.png');
        if (res.ok) {
            const blob = await res.blob();
            const b64 = await new Promise<string>(r => {
                const fr = new FileReader(); fr.onloadend = () => r(fr.result as string); fr.readAsDataURL(blob);
            });
            doc.addImage(b64, 'PNG', MARGIN_LEFT, y, 12, 12);
        }
    } catch { }
    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(TEXT_COLOR);
    doc.text('RANCANGAN PENGAJARAN HARIAN', PAGE_WIDTH / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal').setFontSize(10);
    doc.text('SEKOLAH RENDAH ISLAM AL-KHAIRIAH', PAGE_WIDTH / 2, y + 11, { align: 'center' });
    const lineY = y + 15; doc.setDrawColor(0).setLineWidth(0.5).line(MARGIN_LEFT, lineY, PAGE_WIDTH - MARGIN_RIGHT, lineY);
    return lineY + 10;
}

function drawLabeledField(doc: jsPDF, label: string, value: string, x: number, y: number): void {
    doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(LABEL_COLOR);
    doc.text(`${label} : ${value || '-'}`, x, y);
}

function drawSection(doc: jsPDF, label: string, content: string, y: number): number {
    let curY = y;
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(LABEL_COLOR);
    doc.text(`${label} :`, MARGIN_LEFT, curY); curY += 6;
    doc.setFontSize(11).setTextColor(TEXT_COLOR);
    const lines = splitTextToLines(doc, content || '-', CONTENT_WIDTH - 5);
    lines.forEach(line => {
        if (curY + 6 > PAGE_HEIGHT - 40) { doc.addPage(); curY = MARGIN_TOP; }
        const isAr = isArabicLine(line);
        let final = line; let align: 'left' | 'right' = 'left'; let x = MARGIN_LEFT + 5;
        if (isAr) {
            doc.setFont('Amiri', 'normal'); final = reshapeArabic(line);
            align = 'right'; x = PAGE_WIDTH - MARGIN_RIGHT - 5;
        } else {
            doc.setFont('helvetica', 'normal');
        }
        doc.text(final, x, curY, { align }); curY += 6;
    });
    return curY + 4;
}

function drawFooter(doc: jsPDF): void {
    const fY = PAGE_HEIGHT - 35; const sW = 60;
    doc.setFont('helvetica', 'normal').setFontSize(10).setDrawColor(0).setLineWidth(0.3);
    doc.line(MARGIN_LEFT, fY, MARGIN_LEFT + sW, fY);
    doc.text('Guru Mata Pelajaran', MARGIN_LEFT + sW / 2, fY + 5, { align: 'center' });
    const rX = PAGE_WIDTH - MARGIN_RIGHT - sW;
    doc.line(rX, fY, rX + sW, fY);
    doc.text('Guru Besar', rX + sW / 2, fY + 5, { align: 'center' });
}

export async function generateSinglePDF(record: RPHRecord): Promise<void> {
    const doc = initDocument(); let y = await drawHeader(doc);
    drawLabeledField(doc, 'TARIKH', record.tarikh, MARGIN_LEFT, y);
    drawLabeledField(doc, 'KELAS', record.kelas, PAGE_WIDTH / 2, y); y += 7;
    drawLabeledField(doc, 'HARI', record.hari, MARGIN_LEFT, y);
    drawLabeledField(doc, 'MASA', record.masa, PAGE_WIDTH / 2, y); y += 12;
    y = drawSection(doc, 'SUBJEK', record.subjek, y); y += 2;
    y = drawSection(doc, 'OBJEKTIF', record.objektif, y); y += 2;
    y = drawSection(doc, 'AKTIVITI', record.aktiviti, y); y += 2;
    drawSection(doc, 'REFLEKSI', record.refleksi, y);
    drawFooter(doc); doc.save(`RPH_${record.subjek}_${record.tarikh.replace(/\//g, '-')}.pdf`);
}

export async function generateBulkPDF(records: RPHRecord[]): Promise<void> {
    if (records.length === 0) return;
    const doc = initDocument();
    for (let i = 0; i < records.length; i++) {
        if (i > 0) doc.addPage();
        const r = records[i]; let y = await drawHeader(doc);
        drawLabeledField(doc, 'TARIKH', r.tarikh, MARGIN_LEFT, y);
        drawLabeledField(doc, 'KELAS', r.kelas, PAGE_WIDTH / 2, y); y += 7;
        drawLabeledField(doc, 'HARI', r.hari, MARGIN_LEFT, y);
        drawLabeledField(doc, 'MASA', r.masa, PAGE_WIDTH / 2, y); y += 12;
        y = drawSection(doc, 'SUBJEK', r.subjek, y); y += 2;
        y = drawSection(doc, 'OBJEKTIF', r.objektif, y); y += 2;
        y = drawSection(doc, 'AKTIVITI', r.aktiviti, y); y += 2;
        drawSection(doc, 'REFLEKSI', r.refleksi, y); drawFooter(doc);
    }
    doc.save(`Rekod_RPH_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function previewPDF(record: RPHRecord): Promise<void> {
    const doc = initDocument(); let y = await drawHeader(doc);
    drawLabeledField(doc, 'TARIKH', record.tarikh, MARGIN_LEFT, y);
    drawLabeledField(doc, 'KELAS', record.kelas, PAGE_WIDTH / 2, y); y += 7;
    drawLabeledField(doc, 'HARI', record.hari, MARGIN_LEFT, y);
    drawLabeledField(doc, 'MASA', record.masa, PAGE_WIDTH / 2, y); y += 12;
    y = drawSection(doc, 'SUBJEK', record.subjek, y); y += 2;
    y = drawSection(doc, 'OBJEKTIF', record.objektif, y); y += 2;
    y = drawSection(doc, 'AKTIVITI', record.aktiviti, y); y += 2;
    drawSection(doc, 'REFLEKSI', record.refleksi, y); drawFooter(doc);
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
}
