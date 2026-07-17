/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductionData, DowntimeData, CapaVariables, ProcessCapa } from '../types';

export const calculateAchievementRate = (good: number, planned: number): number => {
  if (planned === 0) return 0;
  return (good / planned) * 100;
};

export const calculateYield = (good: number, input: number): number => {
  if (input === 0) return 0;
  return (good / input) * 100;
};

export const calculateEffectiveCapa = (
  vars: CapaVariables,
  cycleTime: number,
  equipmentCount: number
): number => {
  const availableTime = (vars.workingHours * vars.shiftCount - vars.breakTime) * 60; // in seconds
  if (cycleTime === 0) return 0;
  return (availableTime / cycleTime) * equipmentCount * vars.oee;
};

export const getParetoData = (downtime: DowntimeData[]) => {
  const counts: Record<string, number> = {};
  downtime.forEach(d => {
    counts[d.errorCode] = (counts[d.errorCode] || 0) + d.durationMinutes;
  });

  const sorted = Object.entries(counts)
    .map(([code, duration]) => ({ code, duration }))
    .sort((a, b) => b.duration - a.duration);

  const total = sorted.reduce((sum, item) => sum + item.duration, 0);
  let cumulative = 0;

  return sorted.map(item => {
    cumulative += item.duration;
    return {
      ...item,
      percentage: (cumulative / total) * 100
    };
  });
};

export const generateReportDraft = (
  prodData: ProductionData[],
  downtime: DowntimeData[],
  bottlenecks: ProcessCapa[]
): string => {
  const avgAchievement = prodData.reduce((acc, d) => acc + d.achievementRate, 0) / (prodData.length || 1);
  const totalDowntime = downtime.reduce((acc, d) => acc + d.durationMinutes, 0);
  
  return `[PGM 생산기술 일일 보고서]
작성일: ${new Date().toLocaleDateString()}

1. 생산 총괄 현황
- 전체 평균 달성률: ${avgAchievement.toFixed(1)}%
- 주요 이슈: ${avgAchievement < 90 ? '생산 목표 미달 공정 발생' : '특이사항 없음'}

2. 설비 비가동 현황
- 총 비가동 시간: ${totalDowntime}분
- 최대 비가동 설비: ${downtime.length > 0 ? [...downtime].sort((a, b) => b.durationMinutes - a.durationMinutes)[0].equipmentId : '없음'}

3. 병목 공정 분석 및 대응
${bottlenecks.map(b => `- [${b.processName}] Capa 충족률: ${b.achievementRate.toFixed(1)}% (Cycle Time: ${b.cycleTime}s)`).join('\n')}

4. 특이사항 및 향후 계획
- [확인 필요] 비가동 다발 설비 정밀 점검 예정
- [확인 필요] 병목 공정 사이클 타임 개선 활동 수행`;
};
