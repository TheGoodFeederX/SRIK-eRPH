/** Malaysia is UTC+8 with no DST; never derive today's date from toISOString (audit F-06). */
const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur';

export const todayMalaysia = (now: Date = new Date()): string =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: MALAYSIA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);

export const getMalayDay = (dateString: string): string => {
    if (!dateString) return '';
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return '';
    return days[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
};
