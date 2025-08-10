/**
 * 기관별 넘버링 시스템을 위한 유틸리티 함수들
 */

import { getOrCreateInstitutionDomain, createStudentEmailFromDB } from '../services/api';

/**
 * 기관명을 institute{번호} 형태의 도메인으로 변환
 * 예: "윤초등학교" -> "institute1001"
 * 예: "아미영어" -> "institute1002"
 */
export async function institutionToDomain(institution: string): Promise<string> {
  if (!institution) return 'institute0000';
  
  try {
    return await getOrCreateInstitutionDomain(institution);
  } catch (error) {
    console.error('Failed to get institution domain:', error);
    // 폴백: 간단한 해시 기반
    const hash = institution.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    const number = (hash % 9000) + 1000;
    return `institute${number.toString().padStart(4, '0')}`;
  }
}

/**
 * 학생 이메일 생성
 * 예: studentId="student1", institution="윤초등학교" -> "student1@institute1001"
 */
export async function createStudentEmail(studentId: string, institution: string): Promise<string> {
  if (!institution || !studentId) return '';
  
  try {
    return await createStudentEmailFromDB(studentId, institution);
  } catch (error) {
    console.error('Failed to create student email from DB:', error);
    // 폴백: 로컬 생성
    const cleanStudentId = studentId.toLowerCase().replace(/\s+/g, '');
    const domain = await institutionToDomain(institution);
    return `${cleanStudentId}@${domain}`;
  }
}

/**
 * 이메일에서 기관 번호 추출
 */
export function extractInstitutionNumberFromEmail(email: string): string | null {
  const domain = email.split('@')[1];
  if (!domain) return null;
  
  const match = domain.match(/^institute(\d{4})$/);
  return match ? match[1] : null;
}

/**
 * 도메인 생성 테스트 함수 (개발/디버깅용)
 */
export async function testDomainGeneration(): Promise<void> {
  console.log('=== 넘버링 도메인 생성 테스트 ===');
  
  const testInstitutions = [
    '아미영어',
    '윤초등학교', 
    'Seoul Elementary School',
    '강남고등학교',
    '미래컴퓨터학원',
    '희망태권도',
    '별빛피아노',
    'AMI English Academy',
    '사랑어린이집',
    '튼튼체육관',
    '매쓰홀릭수학학원',
    '비주얼캠프',
    'oxford education'
  ];
  
  for (const institution of testInstitutions) {
    const domain = await institutionToDomain(institution);
    const email = await createStudentEmail('student1', institution);
    console.log(`${institution} → ${domain} → ${email}`);
  }
}
