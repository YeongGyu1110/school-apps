/**
 * Portal App Launcher Controller
 */

// 전역 상태 관리
let appDataList = [];
let activeCategory = 'all';
let searchQuery = '';

// 아이콘 키워드에 맞춰 깨끗한 인라인 SVG 코드를 반환하는 헬퍼 함수 (이모지 대체)
function getIconSvg(iconName) {
    const strokeWidth = 2;
    const icons = {
        layout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
        users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
    };
    return icons[iconName] || icons.default;
}

// 테마 변경 및 동기화
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    
    document.body.setAttribute('data-theme', theme);
    updateThemeButtonText(theme);
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButtonText(newTheme);
}

function updateThemeButtonText(theme) {
    const themeText = document.getElementById('theme-text');
    if (themeText) {
        themeText.textContent = theme === 'dark' ? '라이트 테마 전환' : '다크 테마 전환';
    }
}

// 모바일용 사이드바 제어
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// JSON 데이터 로드 (CORS 예외 처리 및 가상 데이터 백업 포함)
async function loadPortalData() {
    try {
        const response = await fetch('links.json');
        if (!response.ok) throw new Error('Network response was not ok');
        appDataList = await response.json();
    } catch (error) {
        console.warn('links.json 로드 실패. 로컬 가상 백업 데이터를 로딩합니다.', error);
        
        // CORS 정책 등으로 로컬 파일 로드가 거부되었을 때 정상 동작을 유도하는 가상 백업 데이터
        appDataList = [
            {
                "id": "01",
                "title": "gamdog",
                "description": "교사의 시험 감독 일정을 자동 배정합니다.",
                "category": "admin",
                "url": "https://yeonggyu1110.github.io/gamdog/",
                "icon": "calendar"
            },
            {
                "id": "02",
                "title": "class-layout",
                "description": "학급 내 학생의 자리를 랜덤으로 배치시킵니다. .hwp 파일 생성을 지원합니다.",
                "category": "class",
                "url": "https://yeonggyu1110.github.io/class-layout/",
                "icon": "layout"
            },
            {
                "id": "03",
                "title": "clean-assign",
                "description": "학급 내 학생의 청소구역을 자동으로 배정해줍니다. .hwp 파일 생성을 지원합니다.",
                "category": "class",
                "url": "https://yeonggyu1110.github.io/clean-assign/",
                "icon": "users"
            },
            {
                "id": "04",
                "title": "excel-answer-checker",
                "description": "학생의 시험 점수를 자동으로 채점합니다. 엑셀 형식을 지원합니다.",
                "category": "class",
                "url": "https://yeonggyu1110.github.io/excel-answer-checker/",
                "icon": "default"
            },
            {
                "id": "06",
                "title": "3dPrinter",
                "description": "3D프린터운용기능사 기출문제를 풀어볼 수 있습니다.",
                "category": "another",
                "url": "https://yeonggyu1110.github.io/3dPrinter/",
                "icon": "default"
            }
        ];
    }
    
    // 로드 후 데이터 집계 및 화면 생성
    calculateCategoryCounts();
    renderAppGrid();
}

// 카테고리별 앱 개수를 실시간 연산하여 동적 주입
function calculateCategoryCounts() {
    const counts = { all: 0, class: 0, manage: 0, admin: 0 };
    
    appDataList.forEach(app => {
        counts.all++;
        if (counts[app.category] !== undefined) {
            counts[app.category]++;
        }
    });

    // 화면의 배지 숫자 업데이트
    for (let key in counts) {
        const badge = document.getElementById(`count-${key}`);
        if (badge) badge.textContent = counts[key];
    }
}

// 필터링 및 렌더링 루프
function renderAppGrid() {
    const grid = document.getElementById('appGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    grid.innerHTML = '';

    // 검색어 및 카테고리 필터 동시 연산
    const filteredApps = appDataList.filter(app => {
        const matchesCategory = activeCategory === 'all' || app.category === activeCategory;
        const cleanSearch = searchQuery.toLowerCase().trim();
        const matchesSearch = !cleanSearch || 
                              app.title.toLowerCase().includes(cleanSearch) || 
                              app.description.toLowerCase().includes(cleanSearch);
        return matchesCategory && matchesSearch;
    });

    // 빈 화면(Empty State) 제어
    if (filteredApps.length === 0) {
        emptyState.style.display = 'flex';
        grid.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        grid.style.display = 'grid';

        filteredApps.forEach(app => {
            const card = document.createElement('a');
            card.href = app.url;
            card.className = 'app-card';
            card.setAttribute('data-id', app.id);
            card.target = "_blank";

            // 한글 카테고리 변환 매핑
            const categoryLabels = { class: "학급 경영", manage: "학생 관리", admin: "행정 업무", another: "기타" };
            const friendlyCategory = categoryLabels[app.category] || app.category;

            card.innerHTML = `
                <div class="card-top">
                    <div class="card-icon-box">
                        ${getIconSvg(app.icon)}
                    </div>
                    <div class="launch-arrow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                </div>
                <div class="card-body">
                    <div>
                        <h3 class="card-title">${app.title}</h3>
                        <p class="card-desc">${app.description}</p>
                    </div>
                    <span class="card-badge">${friendlyCategory}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

// 이벤트 인터랙션 초기화 바인딩
function initEvents() {
    // 1. 검색창 실시간 필터링
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderAppGrid();
        });
    }

    // 2. 카테고리 탭 전환 인터랙션
    const navItems = document.querySelectorAll('.category-nav .nav-item');
    const workspaceTitle = document.querySelector('.workspace-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            activeCategory = item.getAttribute('data-category');
            
            // 메인 타이틀 동적 업데이트로 사용성 상향
            if (workspaceTitle) {
                const navText = item.querySelector('.nav-text').textContent;
                workspaceTitle.textContent = navText.split(' (')[0]; // 영문 괄호 제거 후 한글 텍스트만 추출
            }

            // 모바일에서 클릭 시 사이드바 접기
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                toggleSidebar();
            }

            renderAppGrid();
        });
    });
}

// 생명 주기 제어
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEvents();
    loadPortalData();

    // 깜빡임 방지용 preload 클래스 제거
    setTimeout(() => {
        document.body.classList.remove('preload');
    }, 100);
});