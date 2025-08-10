import { ActivityType } from '../types';
import React from 'react';

const colors: Record<Exclude<ActivityType, 'empty'>, { light: string[], dark: string[] }> = {
    vocab: { // Yellow - Using steps 2,3,4 for light and 6,7,8 for dark
        light: ['#FFF7D9', '#FFF0B3', '#FFE680'],
        dark: ['#F7BA00', '#D99E00', '#A67600'],
    },
    listening: { // Purple - Using steps 2,3,4 for light and 6,7,8 for dark
        light: ['#EEDDF3', '#E0C6EB', '#D1AEE3'],
        dark: ['#8A4EAF', '#6B3795', '#4C1F74'],
    },
    reading: { // Green - Using steps 2,3,4 for light and 6,7,8 for dark
        light: ['#DCF2E4', '#C6EBD4', '#A9DFC0'],
        dark: ['#3AA06F', '#2D805A', '#1F5C42'],
    },
    grammar: { // Orange - Using steps 2,3,4 for light and 6,7,8 for dark
        light: ['#FFE9D6', '#FFD9B8', '#FFC394'],
        dark: ['#F6781A', '#D65F14', '#A94708'],
    }
};

export const getActivityLevelStyles = (type: ActivityType, level: number): React.CSSProperties => {
    if (type === 'empty' || level < 1 || level > 9) {
        return {
            backgroundColor: '#F3F4F6', // gray-200
            color: '#4B5563',           // gray-600
        };
    }

    const colorSet = colors[type];

    if (level >= 1 && level <= 3) {
        // Tier 1 (Levels 1-3): Bright BG, dark text
        return {
            backgroundColor: colorSet.light[level - 1],
            color: '#1E293B', // slate-800
        };
    } else if (level >= 4 && level <= 6) {
        // Tier 2 (Levels 4-6): White BG, colored inner border & dark text
        const borderColor = colorSet.dark[level - 4];
        return {
            backgroundColor: '#FFFFFF', // white
            color: '#1E293B', // slate-800 (black font)
            boxShadow: `inset 0 0 0 2px ${borderColor}`,
        };
    } else { // Tier 3 (Levels 7-9)
        // Tier 3: Dark BG, white text
        const bgColor = colorSet.dark[level - 7];
        return {
            backgroundColor: bgColor,
            color: '#FFFFFF', // white
        };
    }
};