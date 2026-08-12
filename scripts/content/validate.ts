/*
  songs 와 apps 는 이 사이트의 전 콘텐츠다. 개별로 0건인 것은 정상일 수 있지만
  (곡만 있고 앱이 없는 상태 등) 합쳐서 0건이면 권한 사고나 visibility 오조작으로
  빈 사이트가 배포되는 상황이다. 조회는 성공했지만 내용이 비정상인 경우라
  가용성 폴백 대상이 아니고 항상 빌드를 깨야 한다.

  (예전 '건반' 홈의 5음 음계·유일음 검사(validateFeatured)는 에디토리얼 전환으로
  건반을 걷어내며 함께 제거했다.)
*/
export function assertContentNotEmpty(counts: { songs: number; apps: number }): void {
  if (counts.songs + counts.apps === 0) {
    throw new Error(
      `songs 와 apps 를 합쳐 0건입니다 (songs=${counts.songs}건, apps=${counts.apps}건). ` +
        "이 사이트의 전 콘텐츠가 비어 배포될 상황이라 빌드를 막습니다. " +
        "권한 사고나 visibility 오조작 가능성을 확인하세요.",
    );
  }
}
