/* ==========================================================================
   โมดูลที่ 6: ระบบผู้ช่วย AI สนทนาโต้ตอบอัจฉริยะ, ระบบออกรายงานอัตโนมัติ (AI Report Generator)
   และระบบแก้ไขเว็บไซต์แบบเรียลไทม์ (Real-Time Live Web Editor) (js/ai-assistant.js)
   ========================================================================== */

        let aiChatHistory = [];
        let floatingAiOpen = false;
        let isAiTyping = false;
        let aiVoiceSpeakEnabled = false;
        let aiLastMentionedPlotId = null;
        let speechRecognitionInstance = null;
        let currentAiSubTab = 'all';
        let inlineEditModeActive = false;
        let darkModeActive = false;

        const STORAGE_KEY_GEMINI_API = 'dbt_crop_gemini_api_key_v1';
        const STORAGE_KEY_LIVE_WEB_CFG = 'dbt_crop_live_web_cfg_v1';

        let liveWebConfig = {
            headerTitle: 'AgriGrow Nakhon Phanom — ระบบสมาร์ทฟาร์มและติดตามพืชผลอัจฉริยะ',
            headerSubtitle: 'ติดตามอายุพืช ความสูง จำนวนใบ ความชื้นดิน พิกัดแผนที่ดาวเทียม GPS พร้อมระบบ AI ออกรายงานอัตโนมัติ',
            sidebarTitle: 'ระบบติดตามพืชผล จ.นครพนม',
            sidebarBadge: 'AgriGrow GIS 4.0 AI',
            bannerText: '✨ ระบบอัปเกรดใหม่! รองรับแท็บตัวเลือกครบวงจร สั่ง AI ออกรายงานฉบับสมบูรณ์ และแก้ไขหน้าเว็บแบบเรียลไทม์ได้ทันที',
            bannerVisible: true,
            darkMode: false,
            fontScale: 16
        };

        function loadLiveWebConfig() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY_LIVE_WEB_CFG);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    liveWebConfig = { ...liveWebConfig, ...parsed };
                }
            } catch (e) {}
            syncInputsFromLiveWebConfig();
            applyLiveWebConfigToDOM();
        }

        function saveLiveWebConfig() {
            try {
                localStorage.setItem(STORAGE_KEY_LIVE_WEB_CFG, JSON.stringify(liveWebConfig));
            } catch (e) {}
        }

        function syncInputsFromLiveWebConfig() {
            const hTitle = document.getElementById('liveEditHeaderTitle');
            const hSub = document.getElementById('liveEditHeaderSubtitle');
            const sTitle = document.getElementById('liveEditSidebarTitle');
            const sBadge = document.getElementById('liveEditSidebarBadge');
            const bText = document.getElementById('liveEditBannerText');
            const bVis = document.getElementById('liveEditBannerVisible');

            if (hTitle) hTitle.value = liveWebConfig.headerTitle;
            if (hSub) hSub.value = liveWebConfig.headerSubtitle;
            if (sTitle) sTitle.value = liveWebConfig.sidebarTitle;
            if (sBadge) sBadge.value = liveWebConfig.sidebarBadge;
            if (bText) bText.value = liveWebConfig.bannerText;
            if (bVis) bVis.checked = Boolean(liveWebConfig.bannerVisible);
        }

        function applyLiveWebConfigToDOM() {
            const pageHeaderTitle = document.getElementById('pageHeaderTitle');
            const pageHeaderSubtitle = document.getElementById('pageHeaderSubtitle');
            const sidebarBrandTitle = document.getElementById('sidebarBrandTitle');
            const sidebarBrandBadge = document.getElementById('sidebarBrandBadge');
            const bannerBox = document.getElementById('liveCustomBanner');
            const bannerText = document.getElementById('liveCustomBannerText');

            if (pageHeaderTitle && liveWebConfig.headerTitle) {
                pageHeaderTitle.textContent = liveWebConfig.headerTitle;
                document.title = liveWebConfig.headerTitle;
            }
            if (pageHeaderSubtitle && liveWebConfig.headerSubtitle) {
                pageHeaderSubtitle.textContent = liveWebConfig.headerSubtitle;
            }
            if (sidebarBrandTitle && liveWebConfig.sidebarTitle) {
                sidebarBrandTitle.textContent = liveWebConfig.sidebarTitle;
            }
            if (sidebarBrandBadge && liveWebConfig.sidebarBadge) {
                sidebarBrandBadge.textContent = liveWebConfig.sidebarBadge;
            }
            if (bannerText && liveWebConfig.bannerText) {
                bannerText.textContent = liveWebConfig.bannerText;
            }
            if (bannerBox) {
                if (liveWebConfig.bannerVisible) bannerBox.classList.remove('hidden');
                else bannerBox.classList.add('hidden');
            }

            darkModeActive = Boolean(liveWebConfig.darkMode);
            document.body.classList.toggle('dark-ui-mode', darkModeActive);
            const dmBtn = document.getElementById('btnToggleDarkMode');
            if (dmBtn) dmBtn.textContent = darkModeActive ? '☀️' : '🌙';

            if (liveWebConfig.fontScale) {
                document.documentElement.style.fontSize = liveWebConfig.fontScale + 'px';
            }
        }

        function applyLiveWebConfigFromInputs() {
            const hTitle = document.getElementById('liveEditHeaderTitle');
            const hSub = document.getElementById('liveEditHeaderSubtitle');
            const sTitle = document.getElementById('liveEditSidebarTitle');
            const sBadge = document.getElementById('liveEditSidebarBadge');
            const bText = document.getElementById('liveEditBannerText');
            const bVis = document.getElementById('liveEditBannerVisible');

            if (hTitle) liveWebConfig.headerTitle = hTitle.value;
            if (hSub) liveWebConfig.headerSubtitle = hSub.value;
            if (sTitle) liveWebConfig.sidebarTitle = sTitle.value;
            if (sBadge) liveWebConfig.sidebarBadge = sBadge.value;
            if (bText) liveWebConfig.bannerText = bText.value;
            if (bVis) liveWebConfig.bannerVisible = bVis.checked;

            applyLiveWebConfigToDOM();
            saveLiveWebConfig();
        }

        function toggleDarkModeUI(forceState) {
            liveWebConfig.darkMode = typeof forceState === 'boolean' ? forceState : !liveWebConfig.darkMode;
            applyLiveWebConfigToDOM();
            saveLiveWebConfig();
            showToast(liveWebConfig.darkMode ? '🌙 เปิดโหมดมืด (Dark Mode) แบบเรียลไทม์แล้ว' : '☀️ สลับเป็นโหมดสว่าง (Light Mode) เรียบร้อยแล้ว');
        }

        function setLiveFontScale(px) {
            liveWebConfig.fontScale = Number(px) || 16;
            applyLiveWebConfigToDOM();
            saveLiveWebConfig();
            showToast(`🔤 ปรับขนาดตัวอักษรทั้งหน้าเว็บเป็น ${liveWebConfig.fontScale}px แบบเรียลไทม์แล้ว`);
        }

        function toggleInlinePageEditMode(forceState) {
            inlineEditModeActive = typeof forceState === 'boolean' ? forceState : !inlineEditModeActive;
            document.body.classList.toggle('inline-edit-active', inlineEditModeActive);

            const editableSelectors = 'h1, h2, h3, h4, h5, #pageHeaderSubtitle, #liveCustomBannerText, #autoNarrativeSummary, #narrative30MinSummary';
            document.querySelectorAll(editableSelectors).forEach(el => {
                if (inlineEditModeActive) {
                    el.setAttribute('contenteditable', 'true');
                } else {
                    el.removeAttribute('contenteditable');
                }
            });

            const badge = document.getElementById('liveEditStatusBadge');
            const btnTop = document.getElementById('btnToggleInlineEdit');
            const btnEditor = document.getElementById('btnEditorInlineMode');

            if (badge) badge.classList.toggle('hidden', !inlineEditModeActive);
            if (btnTop) {
                btnTop.textContent = inlineEditModeActive ? '✏️ คลิกแก้เว็บสด: เปิดอยู่' : '✏️ คลิกแก้เว็บสด: ปิด';
                btnTop.className = inlineEditModeActive
                    ? 'bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 shadow'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1';
            }
            if (btnEditor) {
                btnEditor.textContent = inlineEditModeActive
                    ? '✅ โหมดคลิกแก้ข้อความบนเว็บเปิดอยู่ (คลิกเพื่อปิด)'
                    : '✏️ เปิดคลิกแก้ข้อความบนหน้าเว็บโดยตรง';
            }

            showToast(inlineEditModeActive
                ? '✏️ เปิดโหมดคลิกแก้ไขข้อความบนหน้าเว็บแล้ว! คลิกที่หัวข้อหรือข้อความใดก็ได้บนหน้าเว็บเพื่อพิมพ์แก้ไขทันที'
                : '🔒 ปิดโหมดคลิกแก้ไขข้อความบนหน้าเว็บแล้ว');
        }

        function resetLiveWebCustomizations() {
            liveWebConfig = {
                headerTitle: 'AgriGrow Nakhon Phanom — ระบบสมาร์ทฟาร์มและติดตามพืชผลอัจฉริยะ',
                headerSubtitle: 'ติดตามอายุพืช ความสูง จำนวนใบ ความชื้นดิน พิกัดแผนที่ดาวเทียม GPS พร้อมระบบ AI ออกรายงานอัตโนมัติ',
                sidebarTitle: 'ระบบติดตามพืชผล จ.นครพนม',
                sidebarBadge: 'AgriGrow GIS 4.0 AI',
                bannerText: '✨ ระบบอัปเกรดใหม่! รองรับแท็บตัวเลือกครบวงจร สั่ง AI ออกรายงานฉบับสมบูรณ์ และแก้ไขหน้าเว็บแบบเรียลไทม์ได้ทันที',
                bannerVisible: true,
                darkMode: false,
                fontScale: 16
            };
            syncInputsFromLiveWebConfig();
            applyLiveWebConfigToDOM();
            saveLiveWebConfig();
            setAppTheme('emerald', true);
            if (inlineEditModeActive) toggleInlinePageEditMode(false);
            showToast('🔄 รีเซ็ตการตั้งค่าหน้าเว็บและข้อความกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
        }

        function handleQuickOptionSelect(val) {
            const sel = document.getElementById('headerQuickOptionSelect');
            if (sel) sel.value = '';
            if (!val) return;
            if (val === 'ai-chat') {
                switchTab('ai');
                switchAiSubTab('chat');
            } else if (val === 'ai-report') {
                switchTab('ai');
                switchAiSubTab('report');
                generateAiOfficialReport();
            } else if (val === 'ai-editor') {
                switchTab('ai');
                switchAiSubTab('editor');
            } else if (val === 'inline-edit') {
                toggleInlinePageEditMode();
            } else if (val === 'dark-mode') {
                toggleDarkModeUI();
            } else {
                switchTab(val);
            }
        }

        function switchAiSubTab(subTab) {
            currentAiSubTab = subTab || 'all';
            const pChat = document.getElementById('aiSubPanelChat');
            const pReport = document.getElementById('aiSubPanelReport');
            const pEditor = document.getElementById('aiSubPanelEditor');

            if (pChat) pChat.classList.toggle('hidden', currentAiSubTab !== 'all' && currentAiSubTab !== 'chat');
            if (pReport) pReport.classList.toggle('hidden', currentAiSubTab !== 'all' && currentAiSubTab !== 'report');
            if (pEditor) pEditor.classList.toggle('hidden', currentAiSubTab !== 'all' && currentAiSubTab !== 'editor');

            ['all', 'chat', 'report', 'editor'].forEach(key => {
                const btn = document.getElementById('aiSubBtn-' + key);
                if (!btn) return;
                if (key === currentAiSubTab) {
                    btn.className = 'ai-sub-tab bg-white text-slate-900 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow';
                } else {
                    btn.className = 'ai-sub-tab bg-white/15 hover:bg-white/25 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition';
                }
            });

            if (currentAiSubTab === 'report' || currentAiSubTab === 'all') {
                populateAiReportPlotSelector();
                generateAiOfficialReport();
            }
            if (currentAiSubTab === 'editor' || currentAiSubTab === 'all') {
                renderLivePlotEditorTable();
            }
        }

        // =====================================================================
        // ตารางแก้ไขข้อมูลแปลงเพาะปลูกและเซนเซอร์แบบเรียลไทม์ (Live Plot Editor)
        // =====================================================================
        function renderLivePlotEditorTable() {
            const tbody = document.getElementById('livePlotEditorTableBody');
            if (!tbody) return;

            tbody.innerHTML = plots.map(p => {
                const pLogs = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays);
                const latest = pLogs[0] || { ageDays: 28, heightCm: 38.5, leafCount: 15, moisture: 70, soilPh: 6.5 };
                return `
                    <tr class="hover:bg-emerald-50/40 transition">
                        <td class="py-2 px-3 font-extrabold text-slate-700">#${p.id}</td>
                        <td class="py-2 px-3">
                            <input type="text" value="${escapeHtmlText(p.name)}" oninput="updatePlotFieldLive(${p.id}, 'name', this.value)" class="w-full min-w-[180px] rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none">
                        </td>
                        <td class="py-2 px-3">
                            <input type="text" value="${escapeHtmlText(p.zone)}" oninput="updatePlotFieldLive(${p.id}, 'zone', this.value)" class="w-full min-w-[150px] rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 focus:border-emerald-600 focus:outline-none">
                        </td>
                        <td class="py-2 px-2 text-center">
                            <input type="number" min="1" max="365" value="${latest.ageDays}" oninput="updatePlotFieldLive(${p.id}, 'ageDays', this.value)" class="w-16 text-center rounded-lg border border-slate-300 px-1.5 py-1 text-xs font-bold text-slate-900">
                        </td>
                        <td class="py-2 px-2 text-center">
                            <input type="number" step="0.5" min="1" max="500" value="${latest.heightCm}" oninput="updatePlotFieldLive(${p.id}, 'heightCm', this.value)" class="w-20 text-center rounded-lg border border-emerald-300 bg-emerald-50/50 px-1.5 py-1 text-xs font-extrabold text-emerald-800">
                        </td>
                        <td class="py-2 px-2 text-center">
                            <input type="number" min="1" max="500" value="${latest.leafCount}" oninput="updatePlotFieldLive(${p.id}, 'leafCount', this.value)" class="w-16 text-center rounded-lg border border-slate-300 px-1.5 py-1 text-xs font-bold text-teal-800">
                        </td>
                        <td class="py-2 px-2 text-center">
                            <input type="number" min="1" max="100" value="${latest.moisture}" oninput="updatePlotFieldLive(${p.id}, 'moisture', this.value)" class="w-16 text-center rounded-lg border border-sky-300 bg-sky-50/50 px-1.5 py-1 text-xs font-extrabold text-sky-800">
                        </td>
                        <td class="py-2 px-2 text-center">
                            <input type="number" step="0.1" min="3.0" max="9.5" value="${latest.soilPh || 6.5}" oninput="updatePlotFieldLive(${p.id}, 'soilPh', this.value)" class="w-16 text-center rounded-lg border border-slate-300 px-1.5 py-1 text-xs font-bold text-slate-900">
                        </td>
                        <td class="py-2 px-3 text-center">
                            <button type="button" onclick="if(typeof deleteTreeAndGraph==='function'){deleteTreeAndGraph(${p.id}); renderLivePlotEditorTable(); generateAiOfficialReport();}" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                ลบ
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function updatePlotFieldLive(plotId, field, rawVal) {
            const plot = plots.find(p => p.id === Number(plotId));
            if (!plot) return;

            if (field === 'name') {
                plot.name = rawVal;
                plot.shortName = rawVal.split('(')[0].replace(/^แปลงที่\s*\d+\s*:\s*/, '').trim() || rawVal;
            } else if (field === 'zone') {
                plot.zone = rawVal;
            } else {
                const numVal = Number(rawVal);
                if (isNaN(numVal)) return;
                const pLogs = logs.filter(r => r.plotId === plot.id).sort((a, b) => b.ageDays - a.ageDays);
                if (pLogs.length > 0) {
                    pLogs[0][field] = numVal;
                } else {
                    logs.push({
                        id: Date.now(),
                        plotId: plot.id,
                        stage: 'ระยะเจริญเติบโตทางใบ (16-35 วัน)',
                        ageDays: field === 'ageDays' ? numVal : 28,
                        heightCm: field === 'heightCm' ? numVal : 38.5,
                        leafCount: field === 'leafCount' ? numVal : 15,
                        moisture: field === 'moisture' ? numVal : 70,
                        soilPh: field === 'soilPh' ? numVal : 6.5,
                        q1: 5, q2: 5, q3: 5, q4: 5,
                        note: 'อัปเดตข้อมูลแบบเรียลไทม์ผ่านระบบ Live Editor',
                        createdAt: new Date().toISOString().slice(0, 10)
                    });
                }
            }

            saveData();
            if (typeof renderPlotSelectors === 'function') renderPlotSelectors();
            if (typeof renderOverview === 'function') renderOverview();
            if (typeof renderBlueprint === 'function') renderBlueprint();
            if (typeof renderKanban === 'function') renderKanban();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderPlotsTable === 'function') renderPlotsTable();
            if (typeof renderMapMarkers === 'function') renderMapMarkers();
            if (typeof render30MinReport === 'function') render30MinReport();
            renderAiLiveDiagnostics();
            generateAiOfficialReport();
        }

        function applyLiveTreePreset(presetKey) {
            if (typeof TREE_PRESETS === 'undefined' || !TREE_PRESETS[presetKey]) return;
            plots = JSON.parse(JSON.stringify(TREE_PRESETS[presetKey]));
            saveData();
            if (typeof init30MinTelemetryData === 'function') init30MinTelemetryData(true);
            if (typeof renderPlotSelectors === 'function') renderPlotSelectors();
            if (typeof renderOverview === 'function') renderOverview();
            if (typeof renderBlueprint === 'function') renderBlueprint();
            if (typeof renderKanban === 'function') renderKanban();
            if (typeof renderDashboard === 'function') renderDashboard();
            if (typeof renderPlotsTable === 'function') renderPlotsTable();
            if (typeof renderMapMarkers === 'function') renderMapMarkers();
            if (typeof render30MinReport === 'function') render30MinReport();
            renderLivePlotEditorTable();
            renderAiLiveDiagnostics();
            generateAiOfficialReport();
            showToast('🌱 สลับชุดข้อมูลแปลงเพาะปลูกแบบเรียลไทม์เรียบร้อยแล้ว! อัปเดตกราฟ แผนที่ และรายงานทันที');
        }

        // =====================================================================
        // ระบบออกรายงานทางการอัตโนมัติด้วย AI (AI Official Report Generator)
        // =====================================================================
        function populateAiReportPlotSelector() {
            const sel = document.getElementById('aiReportPlotSelect');
            if (!sel) return;
            const prev = sel.value || 'all';
            sel.innerHTML = `<option value="all">ทุกแปลงเพาะปลูกในระบบ (รวมทั้งหมด ${plots.length} แปลง)</option>` +
                plots.map(p => `<option value="${p.id}">${escapeHtmlText(p.name)}</option>`).join('');
            if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
        }

        function buildReportDataContext(targetPlotFilter) {
            const slotTime = typeof currentActive30MinSlot !== 'undefined' ? currentActive30MinSlot : '12:00';
            const metricKey = typeof current30MinMetric !== 'undefined' ? current30MinMetric : 'growthRate';
            const metricCfg = (typeof METRIC_30MIN_CONFIG !== 'undefined' && METRIC_30MIN_CONFIG[metricKey])
                ? METRIC_30MIN_CONFIG[metricKey]
                : { label: 'อัตราการสังเคราะห์แสงและการเติบโตสะสม', shortLabel: 'อัตราเติบโต 30 นาที', unit: 'µmol/m²/s', decimals: 2 };

            const targetPlots = (!targetPlotFilter || targetPlotFilter === 'all')
                ? plots
                : plots.filter(p => String(p.id) === String(targetPlotFilter));

            const rows = targetPlots.map(p => {
                const pLogs = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays);
                const latest = pLogs[0] || { ageDays: 28, heightCm: 38.5, leafCount: 15, moisture: 70, soilPh: 6.5, stage: 'ระยะเจริญเติบโตทางใบ (16-35 วัน)', q1: 5, q2: 5, q3: 5, q4: 5, note: 'สมบูรณ์ดี' };
                const healthAvg = (latest.q1 + latest.q2 + latest.q3 + latest.q4) / 4;
                const val30m = (typeof telemetry30MinStore !== 'undefined' && telemetry30MinStore[p.id] && telemetry30MinStore[p.id][metricKey])
                    ? Number(telemetry30MinStore[p.id][metricKey][slotTime] ?? 21.2)
                    : 21.2;
                const agr = latest.ageDays > 0 ? (latest.heightCm / latest.ageDays) : 1.35;
                return { plot: p, latest, healthAvg, val30m, agr, logCount: pLogs.length };
            });

            const heightStats = calculateStats(rows.map(r => r.latest.heightCm));
            const moistStats = calculateStats(rows.map(r => r.latest.moisture));
            const healthStats = calculateStats(rows.map(r => r.healthAvg));
            const val30mStats = calculateStats(rows.map(r => r.val30m));

            let bestRow = rows[0] || null;
            rows.forEach(r => {
                if (bestRow && r.val30m > bestRow.val30m) bestRow = r;
            });

            return {
                slotTime,
                metricCfg,
                rows,
                heightStats,
                moistStats,
                healthStats,
                val30mStats,
                bestRow
            };
        }

        function generateAiOfficialReport(overrideType, overridePlotId) {
            const typeSel = document.getElementById('aiReportTypeSelect');
            const plotSel = document.getElementById('aiReportPlotSelect');
            const titleInp = document.getElementById('aiReportCustomTitle');
            const authorInp = document.getElementById('aiReportAuthorInput');

            if (overrideType && typeSel) typeSel.value = overrideType;
            if (overridePlotId && plotSel) plotSel.value = String(overridePlotId);

            const reportType = overrideType || (typeSel ? typeSel.value : 'executive');
            const plotFilter = overridePlotId || (plotSel ? plotSel.value : 'all');
            const ctx = buildReportDataContext(plotFilter);

            const typeTitles = {
                executive: 'รายงานสรุปภาพรวมผลการดำเนินงานสมาร์ทฟาร์มและการติดตามพืชผลอัจฉริยะ จ.นครพนม',
                telemetry30m: `รายงานผลการตรวจวัดเซนเซอร์และกราฟอนุกรมเวลาทุก 30 นาที (รอบเวลา ${ctx.slotTime} น.)`,
                thesis: 'รายงานสรุปผลการวิจัยและวิเคราะห์ข้อมูลทางสถิติ (สำหรับบทที่ 4 และบทที่ 5)',
                health: 'รายงานการตรวจสอบดัชนีสุขภาพพืช ความชื้นดิน และค่าความเป็นกรด-ด่าง (pH) รายแปลง',
                financial: 'รายงานการประเมินผลผลิต มูลค่าทางเศรษฐกิจ และศักยภาพการกักเก็บคาร์บอนเครดิต'
            };

            const docTitle = (titleInp && titleInp.value && !overrideType) ? titleInp.value : (typeTitles[reportType] || typeTitles.executive);
            const authorName = (authorInp && authorInp.value) ? authorInp.value : 'คณะผู้วิจัยและพัฒนาระบบสมาร์ทฟาร์ม จ.นครพนม';
            const now = new Date();
            const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = getCurrentTimeShort();
            const refCode = `AGRI-NP-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 899)}`;

            const tableRowsHtml = ctx.rows.map((r, i) => `
                <tr class="border-b border-slate-200 ${i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}">
                    <td class="py-2.5 px-3 font-bold text-slate-800">${i + 1}. ${escapeHtmlText(r.plot.name)}</td>
                    <td class="py-2.5 px-3 text-slate-600">${escapeHtmlText(r.plot.zone)}</td>
                    <td class="py-2.5 px-2 text-center font-semibold">${r.latest.ageDays} วัน</td>
                    <td class="py-2.5 px-2 text-right font-bold text-emerald-700">${r.latest.heightCm.toFixed(1)} ซม.</td>
                    <td class="py-2.5 px-2 text-center">${r.latest.leafCount} ใบ</td>
                    <td class="py-2.5 px-2 text-center font-semibold text-sky-700">${r.latest.moisture}% / pH ${r.latest.soilPh || 6.5}</td>
                    <td class="py-2.5 px-2 text-right font-bold text-rose-700">${r.val30m.toFixed(ctx.metricCfg.decimals)} ${ctx.metricCfg.unit}</td>
                    <td class="py-2.5 px-2 text-center font-extrabold text-amber-700">${r.healthAvg.toFixed(2)} / 5.00</td>
                </tr>
            `).join('');

            let specificAnalysisHtml = '';
            if (reportType === 'telemetry30m') {
                specificAnalysisHtml = `
                    <div class="bg-rose-50/80 border border-rose-200 rounded-xl p-4 space-y-1.5 text-xs sm:text-sm">
                        <h5 class="font-extrabold text-rose-900">⏱️ การวิเคราะห์ข้อมูลอนุกรมเวลาทุก 30 นาที (รอบเวลา ${ctx.slotTime} น.):</h5>
                        <p class="text-slate-700 leading-relaxed">
                            จากการตรวจวัดพารามิเตอร์ <b>${ctx.metricCfg.label}</b> ทุกๆ 30 นาที พบว่าค่าเฉลี่ยรวมของทุกแปลงอยู่ที่
                            <b>${ctx.val30mStats.mean.toFixed(ctx.metricCfg.decimals)} ± ${ctx.val30mStats.sd.toFixed(2)} ${ctx.metricCfg.unit}</b>
                            โดยแปลงที่มีค่าสูงสุดในรอบเวลานี้คือ <b>${ctx.bestRow ? escapeHtmlText(ctx.bestRow.plot.name) : '-'}</b>
                            (${ctx.bestRow ? ctx.bestRow.val30m.toFixed(ctx.metricCfg.decimals) : '-'} ${ctx.metricCfg.unit}) สะท้อนถึงการสังเคราะห์แสงและการดูดซึมน้ำที่สมบูรณ์
                        </p>
                    </div>
                `;
            } else if (reportType === 'thesis') {
                specificAnalysisHtml = `
                    <div class="bg-violet-50/80 border border-violet-200 rounded-xl p-4 space-y-2 text-xs sm:text-sm">
                        <h5 class="font-extrabold text-violet-900">📚 บทสรุปผลการวิจัย (บทที่ 4) และอภิปรายผล (บทที่ 5):</h5>
                        <p class="text-slate-700 leading-relaxed">
                            <b>สรุปผลการทดลอง (บทที่ 4):</b> จากการประเมินการเจริญเติบโตของพืชผลในระบบสมาร์ทฟาร์มจังหวัดนครพนม จำนวน ${ctx.rows.length} แปลงเพาะปลูก
                            พบว่าความสูงต้นเฉลี่ยเท่ากับ <b>${ctx.heightStats.mean.toFixed(2)} ± ${ctx.heightStats.sd.toFixed(2)} ซม.</b>,
                            ความชื้นในดินเฉลี่ยเท่ากับ <b>${ctx.moistStats.mean.toFixed(2)} ± ${ctx.moistStats.sd.toFixed(2)} %RH</b>
                            และดัชนีสุขภาพพืช 4 ด้านมีค่าเฉลี่ยรวม (X̄) เท่ากับ <b>${ctx.healthStats.mean.toFixed(2)}</b> คะแนน (S.D. = <b>${ctx.healthStats.sd.toFixed(2)}</b>)
                            คิดเป็นร้อยละ <b>${(ctx.healthStats.mean * 20).toFixed(2)}%</b> ซึ่งอยู่ในเกณฑ์คุณภาพระดับ <b>ดีเยี่ยม</b>
                        </p>
                        <p class="text-slate-700 leading-relaxed">
                            <b>อภิปรายผล (บทที่ 5):</b> การบูรณาการแผนที่พิกัดดาวเทียม GIS ร่วมกับระบบติดตามกราฟทุก 30 นาทีและผู้ช่วย AI
                            ช่วยให้เกษตรกรและผู้วิจัยสามารถควบคุมปัจจัยสภาพแวดล้อมได้ตรงจุด ลดความเสี่ยงจากความชื้นดินแปรปรวน และเพิ่มอัตราการรอดตายของกล้าไม้เศรษฐกิจได้อย่างมีนัยสำคัญ
                        </p>
                    </div>
                `;
            } else if (reportType === 'financial') {
                const estTrees = ctx.rows.length * 250;
                const estRevenue = estTrees * 65;
                const estCost = estTrees * 18;
                const estProfit = estRevenue - estCost;
                const estCarbonTon = (estTrees * 12.5) / 1000;
                specificAnalysisHtml = `
                    <div class="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-1.5 text-xs sm:text-sm">
                        <h5 class="font-extrabold text-amber-900">💰 การประเมินมูลค่าเศรษฐกิจและคาร์บอนเครดิต:</h5>
                        <p class="text-slate-700 leading-relaxed">
                            จากจำนวนแปลงเพาะปลูกทั้งหมด ${ctx.rows.length} โซน (กำลังการผลิตประมาณ ${estTrees.toLocaleString()} ต้น)
                            คาดการณ์รายได้รวมจากการจำหน่ายกล้าไม้เกรดคัดพิเศษอยู่ที่ประมาณ <b>${estRevenue.toLocaleString()} บาท/รุ่น</b>
                            หักต้นทุนการผลิต (${estCost.toLocaleString()} บาท) คงเหลือกำไรสุทธิประมาณ <b>${estProfit.toLocaleString()} บาท/รุ่น</b>
                            พร้อมศักยภาพการดูดซับก๊าซเรือนกระจกเมื่อเติบโตเต็มวัยประมาณ <b>${estCarbonTon.toFixed(2)} ตัน CO₂ ต่อปี</b>
                        </p>
                    </div>
                `;
            } else {
                specificAnalysisHtml = `
                    <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-1.5 text-xs sm:text-sm">
                        <h5 class="font-extrabold text-emerald-900">🧠 ข้อเสนอแนะเชิงลึกและแผนปฏิบัติการโดย AgriGrow AI:</h5>
                        <ul class="list-disc pl-5 text-slate-700 space-y-1">
                            <li><b>แปลงที่เติบโตโดดเด่นที่สุด:</b> <b>${ctx.bestRow ? escapeHtmlText(ctx.bestRow.plot.name) : '-'}</b> มีอัตราการเติบโตและค่าเซนเซอร์รอบ 30 นาทีสูงสุด แนะนำให้ใช้เป็นแปลงต้นแบบ</li>
                            <li><b>การควบคุมระบบน้ำหยด IoT:</b> ความชื้นดินเฉลี่ยทั้งโครงการอยู่ที่ <b>${ctx.moistStats.mean.toFixed(1)}% RH</b> และค่า pH ดินเฉลี่ย <b>6.5</b> อยู่ในเกณฑ์สมดุลต่อการดูดซึมธาตุอาหารหลัก (N-P-K)</li>
                            <li><b>การติดตามต่อเนื่อง:</b> แนะนำให้บันทึกความสูงและจำนวนใบทุกๆ 7 วัน และตรวจสอบกราฟอนุกรมเวลาทุก 30 นาทีในช่วงเวลา 12:00–15:00 น. ซึ่งมีอัตราการคายน้ำสูงสุด</li>
                        </ul>
                    </div>
                `;
            }

            const reportHtml = `
                <div class="space-y-5">
                    <!-- ส่วนหัวรายงานทางการ -->
                    <div class="border-b-2 border-emerald-700 pb-4 flex flex-wrap items-start justify-between gap-4">
                        <div class="space-y-1">
                            <div class="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700">OFFICIAL SMART FARM & GIS ANALYTICS REPORT</div>
                            <h3 class="text-base sm:text-xl font-extrabold text-slate-900">${escapeHtmlText(docTitle)}</h3>
                            <p class="text-xs text-slate-600">โครงการ: ${escapeHtmlText(liveWebConfig.headerTitle)} • จังหวัดนครพนม</p>
                        </div>
                        <div class="text-xs text-right bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 space-y-0.5">
                            <div><b>เลขที่รายงาน:</b> <span class="font-mono text-emerald-700">${refCode}</span></div>
                            <div><b>วันที่ออกรายงาน:</b> ${dateStr} (${timeStr})</div>
                            <div><b>ผู้จัดทำรายงาน:</b> ${escapeHtmlText(authorName)}</div>
                        </div>
                    </div>

                    <!-- 4 KPI Summary Boxes -->
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <div class="text-slate-500">🌱 จำนวนแปลงที่รายงาน</div>
                            <div class="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">${ctx.rows.length} แปลงเพาะปลูก</div>
                        </div>
                        <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                            <div class="text-emerald-800">📏 ความสูงเฉลี่ย (X̄ ± S.D.)</div>
                            <div class="text-base sm:text-lg font-extrabold text-emerald-900 mt-0.5">${ctx.heightStats.mean.toFixed(1)} ± ${ctx.heightStats.sd.toFixed(1)} ซม.</div>
                        </div>
                        <div class="bg-sky-50/70 border border-sky-200 rounded-xl p-3">
                            <div class="text-sky-800">💧 ความชื้นดินเฉลี่ย</div>
                            <div class="text-base sm:text-lg font-extrabold text-sky-900 mt-0.5">${ctx.moistStats.mean.toFixed(1)}% RH (pH ~6.5)</div>
                        </div>
                        <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                            <div class="text-amber-900">🌟 ดัชนีสุขภาพพืชเฉลี่ย</div>
                            <div class="text-base sm:text-lg font-extrabold text-amber-900 mt-0.5">${ctx.healthStats.mean.toFixed(2)} / 5.00 (${(ctx.healthStats.mean * 20).toFixed(1)}%)</div>
                        </div>
                    </div>

                    <!-- ตารางสรุปข้อมูลรายแปลง -->
                    <div class="space-y-2">
                        <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">📊 ตารางสรุปข้อมูลการเจริญเติบโต สภาพแวดล้อม และค่าเซนเซอร์รายแปลง</h4>
                        <div class="overflow-x-auto rounded-xl border border-slate-200">
                            <table class="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-100 text-slate-800 border-b border-slate-200">
                                        <th class="py-2.5 px-3 font-extrabold">แปลงเพาะปลูก / ชนิดพืช</th>
                                        <th class="py-2.5 px-3 font-extrabold">โซนพื้นที่ / พิกัด</th>
                                        <th class="py-2.5 px-2 font-extrabold text-center">อายุ</th>
                                        <th class="py-2.5 px-2 font-extrabold text-right">ความสูง</th>
                                        <th class="py-2.5 px-2 font-extrabold text-center">จำนวนใบ</th>
                                        <th class="py-2.5 px-2 font-extrabold text-center">ความชื้น / pH</th>
                                        <th class="py-2.5 px-2 font-extrabold text-right">${ctx.metricCfg.shortLabel} (${ctx.slotTime})</th>
                                        <th class="py-2.5 px-2 font-extrabold text-center">คะแนนสุขภาพ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- บทวิเคราะห์เจาะลึก -->
                    ${specificAnalysisHtml}

                    <!-- ลายเซ็นรับรองรายงาน -->
                    <div class="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                        <div>
                            <b>ระบบประมวลผลอัตโนมัติ:</b> AgriGrow AI Analytics Engine v4.0 (Nakhon Phanom Smart Farm GIS)
                        </div>
                        <div class="text-right">
                            ลงชื่อ ....................................................... ผู้รับรองรายงาน (${escapeHtmlText(authorName)})
                        </div>
                    </div>
                </div>
            `;

            const docEl = document.getElementById('aiGeneratedReportDocument');
            if (docEl) {
                docEl.innerHTML = reportHtml;
            }
            return { reportHtml, docTitle, refCode, dateStr, timeStr, ctx };
        }

        function printAiOfficialReport() {
            switchTab('ai');
            switchAiSubTab('report');
            generateAiOfficialReport();
            setTimeout(() => {
                window.print();
            }, 250);
        }

        function downloadAiReportWordDoc() {
            const { reportHtml, docTitle, refCode } = generateAiOfficialReport();
            const fullWordHtml = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="utf-8"><title>${escapeHtmlText(docTitle)}</title>
                <style>
                    body { font-family: 'Sarabun', 'TH SarabunPSK', sans-serif; font-size: 14pt; color: #111827; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 12px; }
                    th, td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 12pt; }
                    th { background-color: #ecfdf5; font-weight: bold; }
                    h3, h4, h5 { color: #064e3b; margin-bottom: 6px; }
                </style>
                </head>
                <body>${reportHtml}</body></html>
            `;
            const blob = new Blob(['\ufeff', fullWordHtml], { type: 'application/msword;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `AgriGrow_Report_${refCode}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('📥 ดาวน์โหลดไฟล์รายงาน Word (.doc) เรียบร้อยแล้ว!');
        }

        function copyAiOfficialReportText() {
            const docEl = document.getElementById('aiGeneratedReportDocument');
            if (!docEl) generateAiOfficialReport();
            const text = (docEl ? (docEl.innerText || docEl.textContent) : '').trim();
            if (!text) return;
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                showToast('📋 คัดลอกเนื้อหารายงานฉบับเต็มเรียบร้อยแล้ว! นำไปวางใน Word หรือ LINE ได้ทันที');
            } catch (e) {}
            document.body.removeChild(ta);
        }

        // =====================================================================
        // ระบบประมวลผลคำสั่ง AI เพื่อแก้ไขหน้าเว็บแบบเรียลไทม์ (AI Live Web Mutator)
        // =====================================================================
        function executeAiLiveWebEditCommand(inputId, presetCommand) {
            const inp = inputId ? document.getElementById(inputId) : null;
            const cmd = (presetCommand || (inp ? inp.value : '') || '').trim();
            if (!cmd) {
                showToast('กรุณาพิมพ์คำสั่งแก้ไขหน้าเว็บที่ต้องการ');
                return;
            }
            if (inp && !presetCommand) inp.value = '';
            askSmartFarmAI(null, cmd);
        }

        function tryProcessRealTimeWebEdit(rawQuestion) {
            const q = rawQuestion.trim();
            const qLower = q.toLowerCase();

            // 1. เปลี่ยนชื่อเว็บ / หัวข้อเว็บ / ชื่อโครงการ
            const titleMatch = q.match(/(?:เปลี่ยนชื่อเว็บเป็น|แก้ชื่อเว็บเป็น|เปลี่ยนหัวข้อเว็บเป็น|แก้หัวข้อเป็น|ตั้งชื่อเว็บว่า|เปลี่ยนชื่อโครงการเป็น)\s*(.+)$/i);
            if (titleMatch && titleMatch[1]) {
                const newTitle = titleMatch[1].replace(/^["'“”]|["'“”]$/g, '').trim();
                liveWebConfig.headerTitle = newTitle;
                liveWebConfig.sidebarTitle = newTitle.slice(0, 38);
                syncInputsFromLiveWebConfig();
                applyLiveWebConfigToDOM();
                saveLiveWebConfig();
                return `🛠️ <b>แก้ไขชื่อเว็บไซต์แบบเรียลไทม์เรียบร้อยแล้วครับ!</b><br>
                • <b>หัวข้อหลักของเว็บไซต์เปลี่ยนเป็น:</b> <span class="text-emerald-700 font-bold">"${escapeHtmlText(newTitle)}"</span><br>
                • อัปเดตทั้งแถบ Header ด้านบน, ชื่อระบบในเมนูด้านซ้าย และ Title ของเบราว์เซอร์ทันทีโดยไม่ต้องรีเฟรชหน้าเว็บครับ`;
            }

            // 2. เปลี่ยนคำอธิบายเว็บ / Subtitle
            const subMatch = q.match(/(?:เปลี่ยนคำอธิบายเว็บเป็น|แก้คำอธิบายเป็น|เปลี่ยนซับไตเติ้ลเป็น|แก้คำโปรยเป็น)\s*(.+)$/i);
            if (subMatch && subMatch[1]) {
                const newSub = subMatch[1].replace(/^["'“”]|["'“”]$/g, '').trim();
                liveWebConfig.headerSubtitle = newSub;
                syncInputsFromLiveWebConfig();
                applyLiveWebConfigToDOM();
                saveLiveWebConfig();
                return `🛠️ <b>แก้ไขคำอธิบายย่อย (Subtitle) ของหน้าเว็บแบบเรียลไทม์เรียบร้อยแล้วครับ!</b><br>
                • ข้อความใหม่: <i>"${escapeHtmlText(newSub)}"</i>`;
            }

            // 3. เพิ่ม / แก้ไข แบนเนอร์ประกาศบนหน้าเว็บ
            const bannerMatch = q.match(/(?:เพิ่มประกาศหน้าเว็บว่า|เพิ่มแบนเนอร์ว่า|แก้แบนเนอร์เป็น|เปลี่ยนประกาศเป็น|แสดงประกาศว่า|เพิ่มประกาศว่า)\s*(.+)$/i);
            if (bannerMatch && bannerMatch[1]) {
                const newBanner = bannerMatch[1].replace(/^["'“”]|["'“”]$/g, '').trim();
                liveWebConfig.bannerText = '📢 ' + newBanner;
                liveWebConfig.bannerVisible = true;
                syncInputsFromLiveWebConfig();
                applyLiveWebConfigToDOM();
                saveLiveWebConfig();
                return `📢 <b>อัปเดตแบนเนอร์ประกาศด้านบนสุดของเว็บไซต์แบบเรียลไทม์แล้วครับ!</b><br>
                • ข้อความประกาศปัจจุบัน: <b>"${escapeHtmlText(liveWebConfig.bannerText)}"</b>`;
            }

            if (qLower.includes('ซ่อนประกาศ') || qLower.includes('ลบแบนเนอร์') || qLower.includes('ปิดแบนเนอร์')) {
                liveWebConfig.bannerVisible = false;
                syncInputsFromLiveWebConfig();
                applyLiveWebConfigToDOM();
                saveLiveWebConfig();
                return `🙈 <b>ซ่อนแบนเนอร์ประกาศด้านบนสุดของหน้าเว็บให้เรียบร้อยแล้วครับ!</b> (สามารถสั่ง <i>"เพิ่มประกาศว่า..."</i> เพื่อแสดงใหม่ได้ตลอดเวลา)`;
            }

            // 4. เปิด/ปิด โหมดมืด (Dark Mode) หรือ โหมดสว่าง
            if (qLower.includes('โหมดมืด') || qLower.includes('dark mode') || qLower.includes('ธีมมืด') || qLower.includes('กลางคืน')) {
                const nextState = qLower.includes('ปิด') ? false : (qLower.includes('สลับ') ? !liveWebConfig.darkMode : true);
                toggleDarkModeUI(nextState);
                return `🌙 <b>ปรับหน้าเว็บเป็น "${liveWebConfig.darkMode ? 'โหมดมืด (Dark Mode)' : 'โหมดสว่าง (Light Mode)'}" แบบเรียลไทม์เรียบร้อยแล้วครับ!</b>`;
            }
            if (qLower.includes('โหมดสว่าง') || qLower.includes('light mode') || qLower.includes('ธีมสว่าง')) {
                toggleDarkModeUI(false);
                return `☀️ <b>สลับหน้าเว็บกลับมาเป็น "โหมดสว่าง (Light Mode)" แบบเรียลไทม์เรียบร้อยแล้วครับ!</b>`;
            }

            // 5. ปรับขนาดตัวอักษรแบบเรียลไทม์
            if (qLower.includes('ขยายตัวอักษร') || qLower.includes('ตัวหนังสือใหญ่') || qLower.includes('ฟอนต์ใหญ่')) {
                setLiveFontScale(18);
                return `🔤 <b>ขยายขนาดตัวอักษรทั้งเว็บไซต์ให้ใหญ่ขึ้น (18px) แบบเรียลไทม์แล้วครับ!</b>`;
            }
            if (qLower.includes('ตัวอักษรปกติ') || qLower.includes('ฟอนต์ปกติ') || qLower.includes('ขนาดตัวอักษรเดิม')) {
                setLiveFontScale(16);
                return `🔤 <b>ปรับขนาดตัวอักษรกลับเป็นขนาดมาตรฐาน (16px) เรียบร้อยแล้วครับ!</b>`;
            }

            // 6. เปิด/ปิด โหมดคลิกแก้ข้อความบนหน้าเว็บโดยตรง
            if (qLower.includes('คลิกแก้ข้อความ') || qLower.includes('แก้ไขข้อความบนเว็บ') || qLower.includes('inline edit')) {
                toggleInlinePageEditMode(true);
                return `✏️ <b>เปิดโหมด "คลิกแก้ไขข้อความบนหน้าเว็บโดยตรง" ให้แล้วครับ!</b><br>
                ตอนนี้คุณสามารถเอาเมาส์ไปคลิกที่หัวข้อ ชื่อการ์ด หรือข้อความใดก็ได้บนหน้าเว็บ แล้วพิมพ์แก้ไขสดๆ ได้เลยครับ`;
            }

            // 7. แก้ไขข้อมูลตัวเลขของต้นไม้/แปลงเพาะปลูกแบบเรียลไทม์ (เช่น "ปรับความสูงต้นที่ 1 เป็น 65", "แก้ความชื้นแปลงที่ 2 เป็น 78")
            const targetPlot = findTargetPlotFromQuestion(qLower);
            if (targetPlot && (qLower.includes('ปรับ') || qLower.includes('แก้') || qLower.includes('ตั้งค่า') || qLower.includes('เปลี่ยน'))) {
                let changedItems = [];
                const heightMatch = q.match(/ความสูง(?:เป็น|อยู่ที่)?\s*(\d+(?:\.\d+)?)/);
                const moistMatch = q.match(/ความชื้น(?:ดิน)?(?:เป็น|อยู่ที่)?\s*(\d+(?:\.\d+)?)/);
                const leafMatch = q.match(/(?:จำนวน)?ใบ(?:เป็น|อยู่ที่)?\s*(\d+)/);
                const phMatch = q.match(/(?:ph|พีเอช)(?:เป็น|อยู่ที่)?\s*(\d+(?:\.\d+)?)/i);
                const renameMatch = q.match(/(?:แก้ชื่อ|เปลี่ยนชื่อ)(?:แปลง|ต้น)?(?:ที่\s*\d+)?\s*เป็น\s*([^\s,].+)$/);

                if (renameMatch && renameMatch[1]) {
                    const cleanName = renameMatch[1].trim();
                    updatePlotFieldLive(targetPlot.id, 'name', `แปลงที่ ${targetPlot.id}: ${cleanName}`);
                    changedItems.push(`ชื่อแปลงเป็น "${targetPlot.name}"`);
                }
                if (heightMatch) {
                    updatePlotFieldLive(targetPlot.id, 'heightCm', Number(heightMatch[1]));
                    changedItems.push(`ความสูงเป็น ${heightMatch[1]} ซม.`);
                }
                if (moistMatch) {
                    updatePlotFieldLive(targetPlot.id, 'moisture', Number(moistMatch[1]));
                    changedItems.push(`ความชื้นดินเป็น ${moistMatch[1]}%`);
                }
                if (leafMatch) {
                    updatePlotFieldLive(targetPlot.id, 'leafCount', Number(leafMatch[1]));
                    changedItems.push(`จำนวนใบเป็น ${leafMatch[1]} ใบ`);
                }
                if (phMatch) {
                    updatePlotFieldLive(targetPlot.id, 'soilPh', Number(phMatch[1]));
                    changedItems.push(`ค่า pH ดินเป็น ${phMatch[1]}`);
                }

                if (changedItems.length > 0) {
                    renderLivePlotEditorTable();
                    return `⚡ <b>อัปเดตข้อมูลของ "${escapeHtmlText(targetPlot.name)}" แบบเรียลไทม์เรียบร้อยแล้วครับ!</b><br>
                    • รายการที่แก้ไขสด: <b>${changedItems.join(', ')}</b><br>
                    • ระบบได้ซิงค์ข้อมูลใหม่เข้าสู่กราฟทุก 30 นาที, โมเดล 3D, แผนที่ GIS และรายงาน AI ทันทีครับ!`;
                }
            }

            return null;
        }

        function initAiAssistant() {
            loadLiveWebConfig();
            const savedKey = localStorage.getItem(STORAGE_KEY_GEMINI_API) || '';
            const keyInput = document.getElementById('inputGeminiApiKey');
            if (keyInput && savedKey) {
                keyInput.value = savedKey;
            }
            updateAiModeBadge();
            populateAiReportPlotSelector();
            renderLivePlotEditorTable();
            generateAiOfficialReport();

            if (aiChatHistory.length === 0) {
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'สวัสดีครับ! ผมคือ AgriGrow AI ผู้ช่วยเกษตรอัจฉริยะจังหวัดนครพนม คุณสามารถขอรายงานฉบับเต็ม สั่งแก้ไขหน้าเว็บแบบเรียลไทม์ หรือถามข้อมูลแปลงปลูกได้ทันทีครับ',
                    html: `สวัสดีครับ! 👋 ผมคือ <b>🤖 AgriGrow AI 4.0 — ผู้ช่วยออกรายงานอัตโนมัติ & แก้ไขเว็บไซต์แบบเรียลไทม์</b><br>
                    คุณสามารถพิมพ์สั่งงานผมในช่องแชทนี้ หรือเลือกใช้แท็บตัวเลือกด้านบนได้เลยครับ:
                    <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs">
                        <li>📑 <b>ขอรายงานฉบับสมบูรณ์ (AI Report):</b> พิมพ์ว่า <i>"ขอรายงาน"</i>, <i>"ขอรายงานกราฟ 30 นาที"</i>, หรือ <i>"ขอรายงานวิจัยบทที่ 4"</i> ผมจะสร้างเอกสารรายงานพร้อมตารางสถิติ ปุ่มพิมพ์ PDF และดาวน์โหลดไฟล์ Word (.doc) ให้ทันที!</li>
                        <li>🛠️ <b>สั่งแก้ไขหน้าเว็บแบบเรียลไทม์ (Live Web Edit):</b> พิมพ์ว่า <i>"เปลี่ยนชื่อเว็บเป็น..."</i>, <i>"เพิ่มประกาศหน้าเว็บว่า..."</i>, <i>"เปิดโหมดมืด"</i>, <i>"ปรับความสูงต้นที่ 1 เป็น 65 ซม."</i> หน้าเว็บจะเปลี่ยนตามคำสั่งทันที!</li>
                        <li>🌱 <b>สั่งงานสมาร์ทฟาร์ม:</b> พิมพ์ว่า <i>"เพิ่มต้นพะยอม"</i>, <i>"ลบต้นที่ 5"</i>, <i>"เปิดน้ำทุกแปลง"</i>, หรือปรึกษาเรื่องโรคพืชและปุ๋ยได้ตลอดเวลาครับ</li>
                    </ul>
                    <div class="mt-2.5 flex flex-wrap gap-1.5">
                        <button type="button" onclick="askSmartFarmAI(null, 'ขอรายงานสรุปภาพรวมสมาร์ทฟาร์มฉบับเต็ม')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-sm">📑 ทดลองขอรายงานฉบับเต็ม</button>
                        <button type="button" onclick="switchAiSubTab('editor')" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition">🛠️ เปิดแผงแก้ไขเว็บเรียลไทม์</button>
                    </div>`
                });
            }
            renderAiChatMessages();
            renderAiLiveDiagnostics();
        }

        function getCurrentTimeShort() {
            const now = new Date();
            return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ' น.';
        }

        function saveGeminiApiKey() {
            const keyInput = document.getElementById('inputGeminiApiKey');
            const val = (keyInput?.value || '').trim();
            try {
                if (val) {
                    localStorage.setItem(STORAGE_KEY_GEMINI_API, val);
                    showToast('🔑 บันทึก Gemini API Key เรียบร้อย! AI พร้อมสนทนาผ่าน Google Gemini 2.5 Flash');
                } else {
                    localStorage.removeItem(STORAGE_KEY_GEMINI_API);
                    showToast('สลับเป็นโหมด AI อัจฉริยะในตัว (รองรับออกรายงาน & แก้ไขเว็บเรียลไทม์ 100%)');
                }
            } catch (e) {}
            updateAiModeBadge();
        }

        function updateAiModeBadge() {
            const savedKey = localStorage.getItem(STORAGE_KEY_GEMINI_API) || '';
            const badge = document.getElementById('aiEngineStatusBadge');
            if (badge) {
                if (savedKey) {
                    badge.textContent = '🟢 เชื่อมต่อ Gemini 2.5 Flash + ระบบออกรายงาน & แก้ไขเว็บสด';
                    badge.className = 'bg-violet-100 text-violet-800 border border-violet-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full';
                } else {
                    badge.textContent = '🟢 พร้อมออกรายงานอัตโนมัติ & แก้ไขเว็บแบบเรียลไทม์';
                    badge.className = 'bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full';
                }
            }
        }

        function toggleAiVoiceOutput() {
            aiVoiceSpeakEnabled = !aiVoiceSpeakEnabled;
            const btns = document.querySelectorAll('.btn-ai-tts-toggle');
            btns.forEach(btn => {
                btn.textContent = aiVoiceSpeakEnabled ? '🔊 เสียงพูด AI: เปิด' : '🔈 เสียงพูด AI: ปิด';
                btn.className = aiVoiceSpeakEnabled
                    ? 'btn-ai-tts-toggle bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl transition shadow'
                    : 'btn-ai-tts-toggle bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold px-3 py-1.5 rounded-xl transition';
            });
            if (!aiVoiceSpeakEnabled && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            showToast(aiVoiceSpeakEnabled ? '🔊 เปิดเสียงพูดโต้ตอบของ AI แล้ว' : '🔈 ปิดเสียงพูดของ AI แล้ว');
        }

        function speakAiText(text) {
            if (!aiVoiceSpeakEnabled || !('speechSynthesis' in window)) return;
            try {
                window.speechSynthesis.cancel();
                const clean = String(text).replace(/<[^>]+>/g, ' ').replace(/[🌱🌳🌲🍁🌿📊⏱️📍💧☀️✨🤖✅⚠️💡📑🛠️]/g, '').replace(/\s+/g, ' ').trim();
                const utter = new SpeechSynthesisUtterance(clean.slice(0, 320));
                utter.lang = 'th-TH';
                utter.rate = 1.05;
                window.speechSynthesis.speak(utter);
            } catch (e) {}
        }

        function startAiVoiceInput(targetInputId) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                showToast('เบราว์เซอร์นี้ไม่รองรับไมโครโฟนแปลงเสียงเป็นข้อความ กรุณาพิมพ์ข้อความในช่องแชทแทนครับ');
                return;
            }
            try {
                if (speechRecognitionInstance) {
                    speechRecognitionInstance.stop();
                }
                speechRecognitionInstance = new SpeechRec();
                speechRecognitionInstance.lang = 'th-TH';
                speechRecognitionInstance.interimResults = false;
                speechRecognitionInstance.maxAlternatives = 1;

                showToast('🎤 กำลังฟังเสียงภาษาไทย... พูดคำสั่ง เช่น "ขอรายงาน" หรือ "เปิดโหมดมืด" ได้เลยครับ');

                speechRecognitionInstance.onresult = function(event) {
                    const transcript = event.results[0][0].transcript;
                    const inp = document.getElementById(targetInputId || 'aiInputMain');
                    if (inp) inp.value = transcript;
                    askSmartFarmAI(targetInputId || 'aiInputMain', transcript);
                };
                speechRecognitionInstance.onerror = function() {
                    showToast('ไม่สามารถรับเสียงจากไมโครโฟนได้ กรุณาตรวจสอบสิทธิ์ไมโครโฟนหรือพิมพ์ถามแทนครับ');
                };
                speechRecognitionInstance.start();
            } catch (e) {
                showToast('ไม่สามารถเปิดไมโครโฟนได้ในขณะนี้');
            }
        }

        function toggleFloatingAiDrawer(forceState) {
            const drawer = document.getElementById('floatingAiDrawer');
            if (!drawer) return;
            floatingAiOpen = typeof forceState === 'boolean' ? forceState : !floatingAiOpen;
            if (floatingAiOpen) {
                drawer.classList.remove('hidden');
                renderAiChatMessages();
                setTimeout(() => {
                    const inp = document.getElementById('aiInputFloating');
                    if (inp) inp.focus();
                }, 80);
            } else {
                drawer.classList.add('hidden');
            }
        }

        function renderAiLiveDiagnostics() {
            const box = document.getElementById('aiLiveDiagnosticsBox');
            if (!box) return;

            const slotTime = typeof currentActive30MinSlot !== 'undefined' ? currentActive30MinSlot : '12:00';
            const metricKey = typeof current30MinMetric !== 'undefined' ? current30MinMetric : 'growthRate';
            const metricCfg = (typeof METRIC_30MIN_CONFIG !== 'undefined' && METRIC_30MIN_CONFIG[metricKey])
                ? METRIC_30MIN_CONFIG[metricKey]
                : { shortLabel: 'อัตราเติบโต', unit: 'µmol/m²/s', decimals: 2 };

            let lowMoistPlots = [];
            let plotSummaries = plots.map((p, idx) => {
                const pLogs = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays);
                const latest = pLogs[0] || { ageDays: 25, heightCm: 35, leafCount: 14, moisture: 70, soilPh: 6.5, q1: 5, q2: 5, q3: 5, q4: 5 };
                if (latest.moisture < 68) lowMoistPlots.push(p.name);
                const val30m = (typeof telemetry30MinStore !== 'undefined' && telemetry30MinStore[p.id] && telemetry30MinStore[p.id][metricKey])
                    ? (telemetry30MinStore[p.id][metricKey][slotTime] ?? 20.5)
                    : 20.5;
                return { plot: p, latest, val30m: Number(val30m), idx };
            });

            const vals30m = plotSummaries.map(x => x.val30m);
            const st30m = calculateStats(vals30m);
            let bestItem = plotSummaries[0];
            plotSummaries.forEach(item => {
                if (item.val30m > (bestItem?.val30m || 0)) bestItem = item;
            });

            box.innerHTML = `
                <div class="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-extrabold text-emerald-900">⏱️ สถานะรอบ 30 นาที (${slotTime} น.)</span>
                        <span class="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">เรียลไทม์</span>
                    </div>
                    <p class="text-xs text-slate-700 leading-relaxed">
                        ค่าเฉลี่ย <b>${metricCfg.shortLabel}</b> ของต้นไม้ทั้ง <b>${plots.length} ต้น</b> อยู่ที่ <b>${st30m.mean.toFixed(metricCfg.decimals)} ± ${st30m.sd.toFixed(2)} ${metricCfg.unit}</b>
                        โดยต้นที่โดดเด่นที่สุดคือ <b>${bestItem ? bestItem.plot.name : '-'}</b> (${bestItem ? bestItem.val30m.toFixed(metricCfg.decimals) : '-'} ${metricCfg.unit})
                    </p>
                </div>

                <div class="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                    <div class="text-xs font-extrabold text-amber-900">📑 ออกรายงานด่วนด้วยคลิกเดียว</div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <button type="button" onclick="askSmartFarmAI(null, 'ขอรายงานสรุปภาพรวมสมาร์ทฟาร์มฉบับเต็ม')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-1.5 px-2 rounded-xl text-[11px] transition">📄 รายงานภาพรวม</button>
                        <button type="button" onclick="downloadAiReportWordDoc()" class="bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-1.5 px-2 rounded-xl text-[11px] transition">📥 โหลด Word (.doc)</button>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <div class="text-xs font-extrabold text-slate-700">🌱 คลิกที่ชื่อต้นไม้เพื่อขอรายงานรายต้นจาก AI:</div>
                    <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        ${plotSummaries.map(item => `
                            <button type="button" onclick="askSmartFarmAI(null, 'ขอรายงานวิเคราะห์ของ ${item.plot.name.replace(/'/g, '')}')" class="w-full text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl p-2.5 flex items-center justify-between text-xs transition">
                                <div class="truncate pr-2">
                                    <div class="font-bold text-slate-800 truncate">${item.plot.icon || '🌳'} ${item.plot.name}</div>
                                    <div class="text-[11px] text-slate-500">สูง ${item.latest.heightCm} ซม. • ชื้น ${item.latest.moisture}% • pH ${item.latest.soilPh || 6.5}</div>
                                </div>
                                <span class="bg-white border border-slate-200 text-emerald-700 font-extrabold px-2 py-1 rounded-lg shrink-0 text-[11px]">
                                    ขอรายงาน ↗
                                </span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        function renderAiChatMessages() {
            const containers = [
                document.getElementById('aiChatMessagesMain'),
                document.getElementById('aiChatMessagesFloating')
            ];

            const htmlContent = aiChatHistory.map(msg => {
                if (msg.role === 'user') {
                    return `
                        <div class="flex justify-end">
                            <div class="max-w-[85%] bg-emerald-700 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm space-y-1">
                                <div class="text-xs sm:text-sm leading-relaxed">${msg.html}</div>
                                <div class="text-[10px] text-emerald-200 text-right">${msg.time}</div>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="flex items-start gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-base shrink-0 mt-0.5 shadow-sm">
                                🤖
                            </div>
                            <div class="max-w-[92%] w-full bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-1.5">
                                <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                                    <span class="text-[11px] font-extrabold text-emerald-800">AgriGrow AI 4.0 (Report & Live Web Editor)</span>
                                    <span class="text-[10px] text-slate-400">${msg.time}</span>
                                </div>
                                <div class="text-xs sm:text-sm leading-relaxed space-y-1.5">${msg.html}</div>
                            </div>
                        </div>
                    `;
                }
            }).join('') + (isAiTyping ? `
                <div class="flex items-center gap-2 text-xs text-slate-500 pl-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>🤖 AI กำลังจัดทำรายงานและประมวลผลคำตอบ...</span>
                </div>
            ` : '');

            containers.forEach(c => {
                if (c) {
                    c.innerHTML = htmlContent;
                    c.scrollTop = c.scrollHeight;
                }
            });
        }

        function escapeHtmlText(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function formatMarkdownToHtml(mdText) {
            let safe = escapeHtmlText(mdText);
            safe = safe.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            safe = safe.replace(/\*(.+?)\*/g, '<i>$1</i>');
            safe = safe.replace(/\n/g, '<br>');
            return safe;
        }

        function findTargetPlotFromQuestion(q) {
            for (let i = 0; i < plots.length; i++) {
                const p = plots[i];
                const numStr = String(p.id);
                if (q.includes(`แปลงที่ ${numStr}`) || q.includes(`แปลง ${numStr}`) || q.includes(`ต้นที่ ${numStr}`) || q.includes(`ต้น ${numStr}`) || q.includes(`#${numStr}`)) {
                    aiLastMentionedPlotId = p.id;
                    return p;
                }
                const keywords = ['ยางนา', 'สักทอง', 'สัก', 'พะยูง', 'กันเกรา', 'ประดู่', 'ตะเคียน', 'พะยอม', 'อินทนิล', 'จำปา', 'มะค่า', 'กฤษณา', 'ชิงชัน', 'มะม่วง', 'ขนุน', 'มะพร้าว', 'ส้มโอ', 'ทุเรียน'];
                for (const kw of keywords) {
                    if (q.includes(kw) && p.name.includes(kw)) {
                        aiLastMentionedPlotId = p.id;
                        return p;
                    }
                }
            }
            if ((q.includes('ต้นนี้') || q.includes('แปลงนี้') || q.includes('มัน')) && aiLastMentionedPlotId) {
                return plots.find(p => p.id === aiLastMentionedPlotId) || null;
            }
            return null;
        }

        // สร้างการ์ดรายงานฉบับสมบูรณ์แสดงในกล่องแชท AI ทันทีเมื่อผู้ใช้ขอรายงาน
        function buildChatReportResponseCard(rawQuestion) {
            const q = rawQuestion.toLowerCase();
            let repType = 'executive';
            if (q.includes('30') || q.includes('กราฟ')) repType = 'telemetry30m';
            else if (q.includes('บทที่ 4') || q.includes('บทที่ 5') || q.includes('วิจัย') || q.includes('สถิติ')) repType = 'thesis';
            else if (q.includes('สุขภาพ') || q.includes('ดิน') || q.includes('ความชื้น')) repType = 'health';
            else if (q.includes('รายได้') || q.includes('กำไร') || q.includes('คาร์บอน') || q.includes('เศรษฐกิจ')) repType = 'financial';

            const targetPlot = findTargetPlotFromQuestion(q);
            const plotFilter = targetPlot ? String(targetPlot.id) : 'all';

            populateAiReportPlotSelector();
            const { reportHtml, docTitle, refCode } = generateAiOfficialReport(repType, plotFilter);

            return `
                <div class="space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2">
                        <div class="text-xs font-extrabold text-amber-900">
                            📑 จัดทำเอกสารรายงานเสร็จสมบูรณ์! (รหัส: <span class="font-mono">${refCode}</span>)
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                            <button type="button" onclick="printAiOfficialReport()" class="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">🖨️ พิมพ์ / PDF</button>
                            <button type="button" onclick="downloadAiReportWordDoc()" class="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">📥 โหลด Word (.doc)</button>
                            <button type="button" onclick="copyAiOfficialReportText()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">📋 คัดลอกรายงาน</button>
                        </div>
                    </div>
                    <div class="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
                        ${reportHtml}
                    </div>
                </div>
            `;
        }

        function buildLocalSmartFarmAiResponse(rawQuestion) {
            const q = rawQuestion.toLowerCase().trim();

            // 0. ตรวจสอบคำสั่งแก้ไขหน้าเว็บแบบเรียลไทม์ก่อน
            const liveEditResult = tryProcessRealTimeWebEdit(rawQuestion);
            if (liveEditResult) {
                return liveEditResult;
            }

            // 1. ตรวจสอบว่าผู้ใช้กำลัง "ขอรายงาน" หรือไม่ -> สร้างรายงานฉบับสมบูรณ์ให้ทันที!
            if (q.includes('รายงาน') || q.includes('report') || q.includes('บทที่ 4') || q.includes('บทที่ 5') || q.includes('สรุปผลทั้งหมด')) {
                return buildChatReportResponseCard(rawQuestion);
            }

            const slotTime = typeof currentActive30MinSlot !== 'undefined' ? currentActive30MinSlot : '12:00';
            const prevTime = typeof getPrevious30MinTimeStr === 'function' ? getPrevious30MinTimeStr(slotTime) : '11:30';
            const metricKey = typeof current30MinMetric !== 'undefined' ? current30MinMetric : 'growthRate';
            const metricCfg = (typeof METRIC_30MIN_CONFIG !== 'undefined' && METRIC_30MIN_CONFIG[metricKey])
                ? METRIC_30MIN_CONFIG[metricKey]
                : { label: 'อัตราการสังเคราะห์แสงและการเติบโตสะสม', shortLabel: 'อัตราเติบโต', unit: 'µmol/m²/s', decimals: 2 };

            const treeDetails = plots.map((p, idx) => {
                const pLogs = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays);
                const latest = pLogs[0] || { ageDays: 28, heightCm: 40, leafCount: 16, moisture: 70, soilPh: 6.5, q1: 5, q2: 5, q3: 5, q4: 5, stage: 'ระยะเจริญเติบโตทางใบ' };
                const healthAvg = ((latest.q1 + latest.q2 + latest.q3 + latest.q4) / 4);
                const val30m = (typeof telemetry30MinStore !== 'undefined' && telemetry30MinStore[p.id] && telemetry30MinStore[p.id][metricKey])
                    ? Number(telemetry30MinStore[p.id][metricKey][slotTime] ?? 20.0)
                    : 20.0;
                return { plot: p, latest, healthAvg, val30m, idx };
            });

            const vals30m = treeDetails.map(x => x.val30m);
            const stats30m = calculateStats(vals30m);
            let best30m = treeDetails[0];
            let min30m = treeDetails[0];
            treeDetails.forEach(item => {
                if (item.val30m > best30m.val30m) best30m = item;
                if (item.val30m < min30m.val30m) min30m = item;
            });

            // 2. คำสั่งลบต้นไม้/กราฟผ่านแชท AI
            if ((q.includes('ลบต้น') || q.includes('ลบแปลง') || q.includes('ลบกราฟ')) && typeof deleteTreeAndGraph === 'function') {
                const target = findTargetPlotFromQuestion(q) || plots[plots.length - 1];
                if (plots.length <= 1) {
                    return `⚠️ ตอนนี้เหลือต้นไม้เพียง 1 ต้นในระบบ จึงไม่สามารถลบเพิ่มได้ครับ`;
                }
                const delName = target.name;
                deleteTreeAndGraph(target.id);
                renderLivePlotEditorTable();
                generateAiOfficialReport();
                return `🗑️ <b>ดำเนินการลบ "${delName}" ออกจากกราฟและลบหมุดบนแผนที่แบบเรียลไทม์ให้เรียบร้อยแล้วครับ!</b><br>
                ตอนนี้ในระบบเหลือต้นไม้ทั้งหมด <b>${plots.length} ต้น</b> (หากต้องการกู้คืน พิมพ์ว่า <i>"กู้คืนต้นไม้"</i> ได้เลยครับ)`;
            }

            if ((q.includes('กู้คืน') || q.includes('ยกเลิกการลบ') || q.includes('undo')) && typeof undoDeleteTree === 'function') {
                undoDeleteTree();
                renderLivePlotEditorTable();
                generateAiOfficialReport();
                return `↩️ <b>กู้คืนข้อมูลต้นไม้ กราฟทุก 30 นาที และหมุดบนแผนที่กลับมาให้เรียบร้อยแล้วครับ!</b> (ปัจจุบันมี ${plots.length} ต้น)`;
            }

            // 3. คำสั่งเพิ่ม/จำลองต้นไม้ใหม่ผ่านแชท AI
            if ((q.includes('เพิ่มต้น') || q.includes('จำลองต้น') || q.includes('สร้างต้น') || q.includes('ปลูกต้น')) && typeof simulateAnotherTree30Min === 'function') {
                const nameMatch = rawQuestion.match(/(?:เพิ่มต้น|ปลูกต้น|สร้างต้น|จำลองต้น)\s*([^\s,]+)?/);
                const customInput = document.getElementById('inputSimTreeName');
                if (nameMatch && nameMatch[1] && !['ไม้', 'ไม้เพิ่ม', 'ใหม่', 'อีก', 'ให้หน่อย'].includes(nameMatch[1])) {
                    if (customInput) customInput.value = 'กล้าไม้' + nameMatch[1];
                }
                simulateAnotherTree30Min(false);
                renderLivePlotEditorTable();
                generateAiOfficialReport();
                const newest = plots[plots.length - 1];
                aiLastMentionedPlotId = newest.id;
                return `🌱 <b>จัดให้เลยครับ! ผมสร้างและปักหมุด "${newest.name}" ลงบนเว็บแบบเรียลไทม์เรียบร้อยแล้ว</b>
                <ul class="list-disc pl-5 mt-1 space-y-0.5">
                    <li>📍 <b>พิกัดหมุดบนแผนที่ดาวเทียม:</b> ${Number(newest.lat).toFixed(4)}, ${Number(newest.lng).toFixed(4)}</li>
                    <li>📈 <b>กราฟทุก 30 นาที & รายงาน:</b> เพิ่มเส้นกราฟและอัปเดตตารางรายงานให้ทันที</li>
                </ul>
                <div class="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onclick="switchTab('report30m')" class="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-lg">📈 ดูกราฟที่เพิ่งเพิ่ม</button>
                    <button type="button" onclick="jumpToPlotOnMap(${newest.id})" class="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-lg">🗺️ ซูมดูหมุดบนแผนที่</button>
                </div>`;
            }

            // 4. คำสั่งเปลี่ยนสีธีม หรือสลับหน้าจอ
            if (q.includes('เปลี่ยนธีม') || q.includes('เปลี่ยนสี')) {
                let themeKey = 'emerald';
                if (q.includes('ทอง') || q.includes('เหลือง') || q.includes('ส้ม')) themeKey = 'amber';
                else if (q.includes('ฟ้า') || q.includes('น้ำเงิน')) themeKey = 'ocean';
                else if (q.includes('ม่วง')) themeKey = 'violet';
                else if (q.includes('ชมพู') || q.includes('แดง')) themeKey = 'rose';
                setAppTheme(themeKey);
                return `🎨 เปลี่ยนโทนสีของเว็บไซต์แบบเรียลไทม์เป็น <b>"${THEMES[themeKey].name}"</b> ให้เรียบร้อยแล้วครับ!`;
            }

            if (q.includes('เปิดน้ำ') || q.includes('รดน้ำ')) {
                const target = findTargetPlotFromQuestion(q);
                if (target && typeof toggleIotDevice === 'function') {
                    if (!iotState[target.id]) iotState[target.id] = { water: false, fan: false, light: false, fert: false };
                    iotState[target.id].water = true;
                    renderBlueprint();
                    return `💦 สั่งเปิดวาล์วน้ำหยดของ <b>${target.name}</b> แบบเรียลไทม์ให้เรียบร้อยแล้วครับ!`;
                }
                if (typeof triggerAllIrrigation === 'function') triggerAllIrrigation();
                return `💦 สั่งเปิดระบบน้ำหยดอัจฉริยะครบทุกแปลง (${plots.length} แปลง) เรียบร้อยแล้วครับ!`;
            }

            // 5. ปรึกษาปัญหาโรคพืช / อาการผิดปกติ
            if (q.includes('ใบเหลือง') || q.includes('ใบไหม้') || q.includes('รากเน่า') || q.includes('โรค') || q.includes('แมลง') || q.includes('หนอน') || q.includes('เพลี้ย') || q.includes('เหี่ยว') || q.includes('โตช้า')) {
                return `🩺 <b>การวินิจฉัยอาการผิดปกติของต้นไม้และวิธีแก้ไขโดย AgriGrow AI:</b><br>
                <div class="space-y-2 mt-1.5 text-xs">
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                        <b>🍂 1. อาการใบเหลือง / ขอบใบไหม้:</b>
                        <ul class="list-disc pl-4 mt-0.5 space-y-0.5">
                            <li><b>ใบล่างเหลืองก่อน:</b> มักเกิดจากขาดธาตุไนโตรเจน (N) หรือความชื้นในดินต่ำกว่า 60% แนะนำให้เสริมปุ๋ยอินทรีย์น้ำหรือปุ๋ยสูตรเสมอ 15-15-15</li>
                            <li><b>ใบอ่อนเหลืองซีดแต่เส้นใบเขียว:</b> เกิดจากค่า pH ดินสูงเกิน 7.0 ทำให้รากดูดธาตุเหล็กไม่ได้ ควรปรับ pH ดินให้อยู่ในช่วง <b>6.0 – 6.6</b></li>
                        </ul>
                    </div>
                    <div class="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                        <b>🦠 2. อาการโคนเน่า / รากเน่า:</b>
                        งดให้น้ำชั่วคราว พรวนดินผิวหน้าให้โปร่ง และใช้เชื้อราไตรโคเดอร์มา (Trichoderma) ผสมน้ำราดโคนต้น
                    </div>
                </div>`;
            }

            // 6. หากถามเจาะจงถึงต้นไม้รายต้น -> แสดงข้อมูลพร้อมปุ่มออกรายงานของต้นนั้น
            const targetPlot = findTargetPlotFromQuestion(q);
            if (targetPlot) {
                const detail = treeDetails.find(t => t.plot.id === targetPlot.id) || treeDetails[0];
                const rank = [...treeDetails].sort((a, b) => b.val30m - a.val30m).findIndex(t => t.plot.id === targetPlot.id) + 1;
                return `🔍 <b>ข้อมูลวิเคราะห์เจาะจง: ${detail.plot.icon || '🌳'} ${detail.plot.name}</b><br>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1.5 text-xs space-y-1">
                    <div>📍 <b>โซนและพิกัดหมุดแผนที่:</b> ${detail.plot.zone} (Lat ${Number(detail.plot.lat || 17.394).toFixed(4)}, Lng ${Number(detail.plot.lng || 104.769).toFixed(4)})</div>
                    <div>📏 <b>การเติบโตล่าสุด:</b> อายุ <b>${detail.latest.ageDays} วัน</b> • ความสูง <b>${detail.latest.heightCm} ซม.</b> • จำนวนใบ <b>${detail.latest.leafCount} ใบ</b></div>
                    <div>💧 <b>สภาพดิน:</b> ความชื้น <b>${detail.latest.moisture}% RH</b> • ค่า pH <b>${detail.latest.soilPh || 6.5}</b> • คะแนนสุขภาพ <b>${detail.healthAvg.toFixed(2)} / 5.00</b></div>
                    <div>⏱️ <b>ค่าในกราฟทุก 30 นาที (${slotTime} น.):</b> วัดค่า ${metricCfg.shortLabel} ได้ <b>${detail.val30m.toFixed(metricCfg.decimals)} ${metricCfg.unit}</b> (อันดับที่ <b>${rank}</b> จาก ${plots.length} ต้น)</div>
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onclick="askSmartFarmAI(null, 'ขอรายงานของ แปลงที่ ${detail.plot.id}')" class="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-lg">📑 ออกรายงานเฉพาะต้นนี้</button>
                    <button type="button" onclick="jumpToPlotOnMap(${detail.plot.id})" class="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-lg">🗺️ ซูมดูหมุดบนแผนที่</button>
                </div>`;
            }

            // 7. คำถามเกี่ยวกับกราฟทุก 30 นาที / สรุปผล
            if (q.includes('30') || q.includes('กราฟ') || q.includes('สรุป') || q.includes('ดีสุด') || q.includes('เปรียบเทียบ')) {
                return buildChatReportResponseCard('รายงานกราฟ 30 นาที');
            }

            // 8. คำตอบสนทนาอัจฉริยะพร้อมปุ่มขอรายงานและแก้ไขเว็บสด
            return `💬 <b>เกี่ยวกับ "${escapeHtmlText(rawQuestion)}" ที่คุณสอบถาม:</b><br>
            จากข้อมูลในระบบสมาร์ทฟาร์ม จ.นครพนม ขณะนี้ (มีต้นไม้ทั้งหมด <b>${plots.length} ต้น</b>, รอบสรุปผลทุก 30 นาทีเวลา <b>${slotTime} น.</b>):
            <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs">
                <li>🏆 <b>ต้นที่เติบโตโดดเด่นที่สุด:</b> <b>${best30m.plot.name}</b> (สูง ${best30m.latest.heightCm} ซม., ${metricCfg.shortLabel} = ${best30m.val30m.toFixed(metricCfg.decimals)} ${metricCfg.unit})</li>
                <li>💧 <b>ความชื้นดินเฉลี่ยทั้งฟาร์ม:</b> <b>${calculateStats(treeDetails.map(t => t.latest.moisture)).mean.toFixed(1)}% RH</b> (ค่า pH เฉลี่ย 6.5)</li>
                <li>💡 <b>สั่งงานด่วน:</b> พิมพ์ว่า <b>"ขอรายงาน"</b> เพื่อรับรายงานตารางสถิติฉบับเต็ม หรือพิมพ์ <b>"เปลี่ยนชื่อเว็บเป็น..."</b> เพื่อแก้ไขหน้าเว็บแบบเรียลไทม์ได้เลยครับ!</li>
            </ul>
            <div class="mt-2 flex flex-wrap gap-1.5">
                <button type="button" onclick="askSmartFarmAI(null, 'ขอรายงานสรุปภาพรวมสมาร์ทฟาร์มฉบับเต็ม')" class="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-lg">📑 ขอรายงานฉบับเต็มทันที</button>
                <button type="button" onclick="switchAiSubTab('editor')" class="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-lg">🛠️ เปิดแผงแก้ไขเว็บเรียลไทม์</button>
            </div>`;
        }

        async function askSmartFarmAI(sourceInputId, presetQuestionText) {
            const inputEl = sourceInputId ? document.getElementById(sourceInputId) : null;
            const question = (presetQuestionText || (inputEl ? inputEl.value : '') || '').trim();
            if (!question) {
                showToast('กรุณาพิมพ์ข้อความหรือคำสั่งให้ AI ครับ');
                return;
            }
            if (inputEl && !presetQuestionText) {
                inputEl.value = '';
            }

            aiChatHistory.push({
                role: 'user',
                time: getCurrentTimeShort(),
                plainText: question,
                html: escapeHtmlText(question)
            });

            const qLower = question.toLowerCase();
            // ตรวจสอบว่าเป็นคำสั่งขอรายงาน หรือ คำสั่งแก้ไขหน้าเว็บแบบเรียลไทม์ หรือ คำสั่งควบคุมฟาร์ม
            const isDirectReportOrEditCommand =
                qLower.includes('รายงาน') || qLower.includes('report') ||
                qLower.includes('บทที่ 4') || qLower.includes('บทที่ 5') ||
                qLower.includes('เปลี่ยนชื่อเว็บ') || qLower.includes('แก้ชื่อเว็บ') ||
                qLower.includes('เปลี่ยนหัวข้อ') || qLower.includes('แก้หัวข้อ') ||
                qLower.includes('ตั้งชื่อเว็บ') || qLower.includes('เปลี่ยนชื่อโครงการ') ||
                qLower.includes('เปลี่ยนคำอธิบาย') || qLower.includes('แก้คำอธิบาย') ||
                qLower.includes('เพิ่มประกาศ') || qLower.includes('เพิ่มแบนเนอร์') ||
                qLower.includes('แก้แบนเนอร์') || qLower.includes('เปลี่ยนประกาศ') ||
                qLower.includes('ซ่อนประกาศ') || qLower.includes('ลบแบนเนอร์') ||
                qLower.includes('โหมดมืด') || qLower.includes('โหมดสว่าง') || qLower.includes('dark mode') ||
                qLower.includes('ขยายตัวอักษร') || qLower.includes('ตัวหนังสือใหญ่') || qLower.includes('ตัวอักษรปกติ') ||
                qLower.includes('คลิกแก้ข้อความ') || qLower.includes('แก้ไขข้อความบนเว็บ') ||
                qLower.includes('ปรับความสูง') || qLower.includes('แก้ความสูง') ||
                qLower.includes('ปรับความชื้น') || qLower.includes('แก้ความชื้น') ||
                qLower.includes('แก้ชื่อแปลง') || qLower.includes('เปลี่ยนชื่อแปลง') ||
                qLower.includes('เพิ่มต้น') || qLower.includes('จำลองต้น') || qLower.includes('สร้างต้น') ||
                qLower.includes('ลบต้น') || qLower.includes('ลบกราฟ') || qLower.includes('กู้คืน') ||
                qLower.includes('เปิดน้ำ') || qLower.includes('รดน้ำ') || qLower.includes('เปลี่ยนธีม') || qLower.includes('เปลี่ยนสี');

            if (isDirectReportOrEditCommand) {
                const actionReplyHtml = buildLocalSmartFarmAiResponse(question);
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: actionReplyHtml.replace(/<[^>]+>/g, ' '),
                    html: actionReplyHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText(actionReplyHtml);
                return;
            }

            isAiTyping = true;
            renderAiChatMessages();

            const slotTime = typeof currentActive30MinSlot !== 'undefined' ? currentActive30MinSlot : '12:00';
            const metricKey = typeof current30MinMetric !== 'undefined' ? current30MinMetric : 'growthRate';
            const farmContext = plots.map(p => {
                const pLogs = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays);
                const latest = pLogs[0] || {};
                const val30 = (typeof telemetry30MinStore !== 'undefined' && telemetry30MinStore[p.id] && telemetry30MinStore[p.id][metricKey])
                    ? telemetry30MinStore[p.id][metricKey][slotTime]
                    : '-';
                return `${p.name} (พิกัด ${p.lat},${p.lng}): อายุ ${latest.ageDays || 28} วัน, สูง ${latest.heightCm || 40} ซม., ใบ ${latest.leafCount || 16} ใบ, ความชื้นดิน ${latest.moisture || 70}%, pH ${latest.soilPh || 6.5}, ค่ารอบ 30 นาที (${slotTime} น.) = ${val30}`;
            }).join(' | ');

            const systemPrompt = `คุณคือ AgriGrow AI 4.0 ผู้ช่วยนักวิชาการเกษตรและสมาร์ทฟาร์มอัจฉริยะ จังหวัดนครพนม ตอบโต้เป็นภาษาไทยอย่างเป็นธรรมชาติ กระชับ ชัดเจน และตรงคำถาม ข้อมูลจริงในฟาร์มขณะนี้ (${plots.length} แปลง, รอบเวลาสรุปทุก 30 นาทีล่าสุดคือ ${slotTime} น.): ${farmContext}`;

            const savedApiKey = localStorage.getItem(STORAGE_KEY_GEMINI_API) || '';
            if (savedApiKey) {
                try {
                    const recentTurns = aiChatHistory.slice(-6).map(m => ({
                        role: m.role === 'user' ? 'user' : 'model',
                        parts: [{ text: m.plainText || m.html.replace(/<[^>]+>/g, ' ') }]
                    }));
                    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(savedApiKey)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            contents: recentTurns
                        })
                    });
                    const data = await resp.json();
                    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (candidateText) {
                        isAiTyping = false;
                        const formatted = formatMarkdownToHtml(candidateText);
                        aiChatHistory.push({
                            role: 'ai',
                            time: getCurrentTimeShort(),
                            plainText: candidateText,
                            html: formatted
                        });
                        renderAiChatMessages();
                        renderAiLiveDiagnostics();
                        speakAiText(candidateText);
                        return;
                    }
                } catch (err) {}
            }

            setTimeout(() => {
                const replyHtml = buildLocalSmartFarmAiResponse(question);
                isAiTyping = false;
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: replyHtml.replace(/<[^>]+>/g, ' '),
                    html: replyHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText(replyHtml);
            }, 180);
        }

        function clearAiChatHistory() {
            aiChatHistory = [];
            initAiAssistant();
            showToast('🧹 ล้างประวัติการสนทนากับ AI เรียบร้อยแล้ว');
        }

        function copyLatestAiReply() {
            const lastAi = [...aiChatHistory].reverse().find(m => m.role === 'ai');
            if (!lastAi) return;
            const tmp = document.createElement('div');
            tmp.innerHTML = lastAi.html;
            const plain = tmp.innerText || tmp.textContent || '';
            const textarea = document.createElement('textarea');
            textarea.value = plain;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('📋 คัดลอกคำตอบ/รายงานล่าสุดของ AI เรียบร้อยแล้ว!');
            } catch (e) {
                showToast('ไม่สามารถคัดลอกได้');
            }
            document.body.removeChild(textarea);
        }
