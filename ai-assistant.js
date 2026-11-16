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
            headerTitle: 'ติดตามการเติบโตพืชผล',
            headerSubtitle: 'ติดตามอายุพืช ความสูง จำนวนใบ ความชื้นดิน พิกัดแผนที่ดาวเทียม GPS พร้อมระบบ AI ออกรายงานอัตโนมัติ',
            sidebarTitle: 'ติดตามการเติบโตพืชผล',
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
                    if (parsed.headerTitle && (parsed.headerTitle.includes('ศูนย์วิจัยเกษตรอัจฉริยะ') || parsed.headerTitle.includes('AgriGrow Nakhon Phanom —'))) {
                        parsed.headerTitle = 'ติดตามการเติบโตพืชผล';
                    }
                    if (parsed.sidebarTitle && (parsed.sidebarTitle.includes('ศูนย์วิจัยเกษตรอัจฉริยะ') || parsed.sidebarTitle.includes('ระบบติดตามพืชผล'))) {
                        parsed.sidebarTitle = 'ติดตามการเติบโตพืชผล';
                    }
                    liveWebConfig = { ...liveWebConfig, ...parsed };
                    saveLiveWebConfig();
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

        function toggleInlinePageEditMode() {
            inlineEditModeActive = false;
            document.body.classList.remove('inline-edit-active');
        }

        function toggleWebsitePowerStatus() {
            // ปิดฟีเจอร์เปิด/ปิดเว็บไซต์ตามคำสั่งผู้ใช้ (เปิดใช้งานตลอดเวลา)
        }

        function resetLiveWebCustomizations() {
            liveWebConfig = {
                headerTitle: 'ติดตามการเติบโตพืชผล',
                headerSubtitle: 'ติดตามอายุพืช ความสูง จำนวนใบ ความชื้นดิน พิกัดแผนที่ดาวเทียม GPS พร้อมระบบ AI ออกรายงานอัตโนมัติ',
                sidebarTitle: 'ติดตามการเติบโตพืชผล',
                sidebarBadge: 'AgriGrow GIS 4.0 AI',
                bannerText: '✨ ระบบติดตามการเติบโตพืชผลอัจฉริยะ — วิเคราะห์ข้อมูลเชิงลึกทุก 30 นาที พร้อมส่งออกรายงาน Excel (.xls) และ Word (.doc) ทันที',
                bannerVisible: true,
                darkMode: false,
                fontScale: 16
            };
            syncInputsFromLiveWebConfig();
            applyLiveWebConfigToDOM();
            saveLiveWebConfig();
            setAppTheme('emerald', true);
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
        // ตารางแก้ไขข้อมูลแปลงเพาะปลูกและเซนเซอร์แบบเรียลไทม์ (Live Plot Editor & Add Tree Studio)
        // =====================================================================
        function renderLivePlotEditorTable() {
            const tbody1 = document.getElementById('livePlotEditorTableBody');
            const tbody2 = document.getElementById('addTreeStudioTableBody');
            if (!tbody1 && !tbody2) return;

            const rowsHtml = plots.map(p => {
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
                        <td class="py-2 px-3 text-center whitespace-nowrap">
                            <div class="inline-flex items-center gap-1">
                                <button type="button" onclick="if(typeof startPinningTreeOnMap==='function'){startPinningTreeOnMap(${p.id});}" class="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-2 py-1 rounded-lg text-[11px] font-extrabold" title="ไปปักหมุดหรือย้ายจุดต้นนี้บนแผนที่">
                                    📍 ปักหมุด
                                </button>
                                <button type="button" onclick="if(typeof deleteTreeAndGraph==='function'){deleteTreeAndGraph(${p.id}); renderLivePlotEditorTable(); generateAiOfficialReport();}" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg text-[11px] font-bold">
                                    ลบ
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            if (tbody1) tbody1.innerHTML = rowsHtml;
            if (tbody2) tbody2.innerHTML = rowsHtml;
        }

        function addNewTreeFromStudio(goToMap) {
            const nameInput = document.getElementById('studioInputTreeName') || document.getElementById('inputSimTreeName');
            const zoneInput = document.getElementById('studioInputTreeZone') || document.getElementById('inputSimTreeZone');
            const heightInput = document.getElementById('studioInputTreeHeight') || document.getElementById('inputSimTreeHeight');

            const simName = document.getElementById('inputSimTreeName');
            const simZone = document.getElementById('inputSimTreeZone');
            const simHeight = document.getElementById('inputSimTreeHeight');

            if (simName && nameInput) simName.value = nameInput.value;
            if (simZone && zoneInput) simZone.value = zoneInput.value;
            if (simHeight && heightInput) simHeight.value = heightInput.value;

            const autoPinCheck = document.getElementById('autoGoToPinMapAfterAdd');
            const shouldGoToMap = (typeof goToMap === 'boolean') ? goToMap : (autoPinCheck ? autoPinCheck.checked : true);

            const customHeight = heightInput ? parseFloat(heightInput.value) : NaN;
            if (typeof simulateAnotherTree30Min === 'function') {
                simulateAnotherTree30Min(shouldGoToMap);
            }
            if (!isNaN(customHeight) && customHeight > 0 && plots.length > 0) {
                const newestPlot = plots[plots.length - 1];
                updatePlotFieldLive(newestPlot.id, 'heightCm', customHeight);
            }
            if (nameInput) nameInput.value = '';
            if (zoneInput) zoneInput.value = '';
            renderLivePlotEditorTable();
            populateAiReportPlotSelector();
        }

        function quickAddSpeciesTree(speciesName, initHeight, forceGoToMap) {
            const nameInput = document.getElementById('studioInputTreeName') || document.getElementById('inputSimTreeName');
            const heightInput = document.getElementById('studioInputTreeHeight') || document.getElementById('inputSimTreeHeight');
            if (nameInput) nameInput.value = speciesName;
            if (heightInput && initHeight) heightInput.value = initHeight;
            const autoPinCheck = document.getElementById('autoGoToPinMapAfterAdd');
            const shouldGoToMap = (typeof forceGoToMap === 'boolean') ? forceGoToMap : (autoPinCheck ? autoPinCheck.checked : true);
            addNewTreeFromStudio(shouldGoToMap);
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

        function downloadAiReportWordDoc(forcedType, forcedPlot) {
            const { reportHtml, docTitle, refCode } = generateAiOfficialReport(forcedType, forcedPlot);
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
            a.download = `AgriGrow_Word_Report_${refCode}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('📘 ดาวน์โหลดไฟล์รายงาน Microsoft Word (.doc) เรียบร้อยแล้ว!');
            return { docTitle, refCode, filename: `AgriGrow_Word_Report_${refCode}.doc` };
        }

        function exportAiExcelFile(forcedType, forcedPlot) {
            const ctx = collectFullFarmAiContext();
            const now = new Date();
            const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
            const refCode = 'XLS-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
            const targetPlots = (forcedPlot && forcedPlot !== 'all')
                ? ctx.plotDetails.filter(d => String(d.plot.id) === String(forcedPlot))
                : ctx.plotDetails;

            const heights = targetPlots.map(d => Number(d.latest.heightCm || 0));
            const leaves = targetPlots.map(d => Number(d.latest.leafCount || 0));
            const moistures = targetPlots.map(d => Number(d.latest.moisture || 0));
            const vals30m = targetPlots.map(d => Number(d.val30m || 0));

            const stH = calculateStats(heights);
            const stL = calculateStats(leaves);
            const stM = calculateStats(moistures);
            const st30 = calculateStats(vals30m);

            const plotRowsHtml = targetPlots.map((d, idx) => `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td style="text-align:center;">#${d.plot.id}</td>
                    <td><b>${escapeHtmlText(d.plot.name)}</b></td>
                    <td>${escapeHtmlText(d.plot.zone)}</td>
                    <td style="text-align:center;">${d.plot.lat}, ${d.plot.lng}</td>
                    <td style="text-align:center;">${d.latest.ageDays}</td>
                    <td style="text-align:right; font-weight:bold; color:#065f46;">${Number(d.latest.heightCm).toFixed(1)}</td>
                    <td style="text-align:center;">${d.latest.leafCount}</td>
                    <td style="text-align:center;">${d.latest.moisture}%</td>
                    <td style="text-align:center;">${d.latest.soilPh || 6.5}</td>
                    <td style="text-align:right; font-weight:bold; color:#0369a1;">${Number(d.val30m).toFixed(ctx.metricCfg.decimals)}</td>
                    <td style="text-align:center;">${d.avgQ.toFixed(2)} (${d.grade})</td>
                </tr>
            `).join('');

            const slots = (typeof TIME_SLOTS_30M !== 'undefined' && Array.isArray(TIME_SLOTS_30M)) ? TIME_SLOTS_30M.slice(0, 16) : ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
            const slotHeaderCells = slots.map(s => `<th style="background:#0f172a; color:#ffffff;">${s} น.</th>`).join('');
            const slotRowsHtml = targetPlots.map(d => {
                const cells = slots.map(s => {
                    const v = (typeof telemetry30MinStore !== 'undefined' && telemetry30MinStore[d.plot.id] && telemetry30MinStore[d.plot.id][ctx.metricKey])
                        ? (telemetry30MinStore[d.plot.id][ctx.metricKey][s] ?? d.val30m)
                        : d.val30m;
                    return `<td style="text-align:right;">${Number(v).toFixed(ctx.metricCfg.decimals)}</td>`;
                }).join('');
                return `<tr><td><b>#${d.plot.id} ${escapeHtmlText(d.plot.name)}</b></td><td>${escapeHtmlText(d.plot.zone)}</td>${cells}</tr>`;
            }).join('');

            const excelHtml = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Sarabun', 'TH SarabunPSK', Tahoma, sans-serif; font-size: 11pt; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
                        th, td { border: 1px solid #94a3b8; padding: 6px 8px; }
                        th { background-color: #065f46; color: #ffffff; font-weight: bold; }
                        .title { font-size: 15pt; font-weight: bold; color: #064e3b; }
                        .subtitle { font-size: 11pt; color: #334155; }
                        .summary-row td { background-color: #ecfdf5; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="title">ตารางฐานข้อมูลและสถิติการเติบโตพืชผล (AgriGrow Excel Report)</div>
                    <div class="subtitle">รหัสเอกสาร: ${refCode} | วันที่ออกไฟล์: ${dateStr} เวลา ${timeStr} | จำนวนต้นไม้: ${targetPlots.length} ต้น</div>
                    <br/>
                    <table>
                        <thead>
                            <tr>
                                <th>ลำดับ</th>
                                <th>รหัสแปลง</th>
                                <th>ชื่อต้นไม้ / สายพันธุ์</th>
                                <th>โซนเพาะปลูก</th>
                                <th>พิกัด GPS (Lat, Lng)</th>
                                <th>อายุพืช (วัน)</th>
                                <th>ความสูง (ซม.)</th>
                                <th>จำนวนใบ (ใบ)</th>
                                <th>ความชื้นดิน (%RH)</th>
                                <th>ค่า pH ดิน</th>
                                <th>${escapeHtmlText(ctx.metricCfg.shortLabel)} (${ctx.slotTime} น.)</th>
                                <th>เกรดคุณภาพ (X̄)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${plotRowsHtml}
                            <tr class="summary-row">
                                <td colspan="6" style="text-align:right;">ค่าเฉลี่ยรวมทุกแปลง (Mean / X̄)</td>
                                <td style="text-align:right;">${stH.mean.toFixed(2)} ซม.</td>
                                <td style="text-align:center;">${stL.mean.toFixed(1)} ใบ</td>
                                <td style="text-align:center;">${stM.mean.toFixed(1)}%</td>
                                <td style="text-align:center;">6.50</td>
                                <td style="text-align:right;">${st30.mean.toFixed(2)} ${escapeHtmlText(ctx.metricCfg.unit)}</td>
                                <td style="text-align:center;">S.D. = ${stH.sd.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="title">ตารางที่ 2: ข้อมูลเซนเซอร์ราย 30 นาที (${escapeHtmlText(ctx.metricCfg.label)})</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="background:#0f172a; color:#ffffff;">ชื่อต้นไม้</th>
                                <th style="background:#0f172a; color:#ffffff;">โซน</th>
                                ${slotHeaderCells}
                            </tr>
                        </thead>
                        <tbody>
                            ${slotRowsHtml}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const filename = `AgriGrow_Excel_Data_${refCode}.xls`;
            const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('📊 สร้างและดาวน์โหลดไฟล์ตาราง Microsoft Excel (.xls) เรียบร้อยแล้ว!');
            return { refCode, filename, count: targetPlots.length, stH, stL, stM, st30, ctx };
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

            // เปิด/ปิด โหมดมืด (Dark Mode) หรือ โหมดสว่าง
            if (qLower.includes('โหมดมืด') || qLower.includes('dark mode') || qLower.includes('ธีมมืด') || qLower.includes('กลางคืน')) {
                const nextState = qLower.includes('ปิด') ? false : (qLower.includes('สลับ') ? !liveWebConfig.darkMode : true);
                toggleDarkModeUI(nextState);
                return `🌙 <b>ปรับหน้าเว็บเป็น "${liveWebConfig.darkMode ? 'โหมดมืด (Dark Mode)' : 'โหมดสว่าง (Light Mode)'}" เรียบร้อยแล้วครับ!</b>`;
            }
            if (qLower.includes('โหมดสว่าง') || qLower.includes('light mode') || qLower.includes('ธีมสว่าง')) {
                toggleDarkModeUI(false);
                return `☀️ <b>สลับหน้าเว็บกลับมาเป็น "โหมดสว่าง (Light Mode)" เรียบร้อยแล้วครับ!</b>`;
            }

            // แก้ไขข้อมูลตัวเลขของต้นไม้/แปลงเพาะปลูก (เช่น "ปรับความสูงต้นที่ 1 เป็น 65", "แก้ความชื้นแปลงที่ 2 เป็น 78")
            const targetPlot = findTargetPlotFromQuestion(qLower);
            if (targetPlot && (qLower.includes('ปรับ') || qLower.includes('แก้') || qLower.includes('ตั้งค่า') || qLower.includes('เปลี่ยน'))) {
                let changedItems = [];
                const heightMatch = q.match(/ความสูง(?:เป็น|อยู่ที่)?\s*(\d+(?:\.\d+)?)/);
                const moistMatch = q.match(/ความชื้น(?:ดิน)?(?:เป็น|อยู่ที่)?\s*(\d+(?:\.\d+)?)/);
                const leafMatch = q.match(/(?:จำนวน)?ใบ(?:เป็น|อยู่ที่)?\s*(\d+)/);
                const phMatch = q.match(/(?:ph|พีเอช)(?:เป็น|อยู่ที่)?\s*(\d+(?:\.\d+)?)/i);

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
                    return `⚡ <b>อัปเดตข้อมูลของ "${escapeHtmlText(targetPlot.name)}" เรียบร้อยแล้วครับ!</b><br>
                    • รายการที่อัปเดต: <b>${changedItems.join(', ')}</b><br>
                    • ซิงค์ข้อมูลใหม่เข้าสู่กราฟทุก 30 นาที, โมเดล 3D, แผนที่ GIS และรายงาน Excel/Word ทันทีครับ!`;
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
                    plainText: 'สวัสดีครับ! ผมคือ Antigravity AI Pro 5.0 สมองกลอัจฉริยะรุ่นใหม่ คุณสามารถถามวิเคราะห์เชิงลึกได้ทุกเรื่อง ขอไฟล์ Excel ได้ Excel ขอไฟล์ Word ได้ Word คำนวณสูตรปุ๋ย-น้ำ พยากรณ์ผลผลิต หรือถามความรู้ทั่วไปได้ทันทีครับ',
                    html: `สวัสดีครับ! 👋 ผมคือ <b>🧠 Antigravity AI Pro 5.0 (Multi-Model Deep Reasoning & Report Engine)</b> ผู้ช่วยอัจฉริยะที่อัปเกรดความฉลาดขั้นสูงสำหรับระบบติดตามการเติบโตพืชผลครับ!<br>
                    ความสามารถหลักที่คุณสั่งงานหรือถามผมได้ทันที:
                    <ul class="list-disc pl-5 mt-1.5 space-y-1 text-xs">
                        <li>📊 <b>ขอ Excel ได้ Excel / ขอ Word ได้ Word ทันที:</b> พิมพ์ <i>"ขอ Excel"</i> หรือ <i>"ขอ Word"</i> ระบบจะสร้างและดาวน์โหลดไฟล์ <code>.xls</code> หรือ <code>.doc</code> ที่รวมตารางสถิติ ($\bar{X}$, S.D.) และข้อมูลเซนเซอร์ 30 นาทีให้ทันที</li>
                        <li>🧠 <b>วิเคราะห์เชิงลึกระดับผู้เชี่ยวชาญ (Deep Agronomic & Statistical Reasoning):</b> วิเคราะห์จัดอันดับการเติบโตทุกแปลง, คำนวณอัตราการเติบโตเฉลี่ยต่อวัน (ซม./วัน), คำนวณสูตรปุ๋ย N-P-K และปริมาณน้ำหยด (ลิตร/วัน), พยากรณ์รายได้และคาร์บอนเครดิต ($\text{tCO}_2\text{e}$)</li>
                        <li>🌐 <b>ถาม-ตอบความรู้ทั่วไป & วิชาการได้ทุกเรื่อง:</b> เชื่อมต่อกับ Cloud LLM หลายโมเดลอัตโนมัติ ตอบได้ทั้งวิทยาศาสตร์ คณิตศาสตร์ การเขียนบทความวิจัย บทที่ 4–5 การเขียนโปรแกรม และความรู้รอบตัว</li>
                    </ul>
                    <div class="mt-2.5 flex flex-wrap gap-1.5">
                        <button type="button" onclick="askSmartFarmAI(null, 'ขอไฟล์ Excel สรุปข้อมูลทุกแปลงและเซนเซอร์ 30 นาที')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-sm">📊 ขอไฟล์ Excel (.xls)</button>
                        <button type="button" onclick="askSmartFarmAI(null, 'ขอไฟล์ Word รายงานสรุปภาพรวมสมาร์ทฟาร์มฉบับเต็ม')" class="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-sm">📘 ขอไฟล์ Word (.doc)</button>
                        <button type="button" onclick="askSmartFarmAI(null, 'วิเคราะห์เปรียบเทียบการเติบโตทุกแปลงเชิงลึก จัดอันดับ และชี้จุดที่ต้องปรับปรุง')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition shadow-sm">🏆 วิเคราะห์เปรียบเทียบทุกแปลง</button>
                        <button type="button" onclick="askSmartFarmAI(null, 'คำนวณสูตรปุ๋ย N-P-K ปริมาณน้ำหยด และวิธีปรับค่า pH ดินของแต่ละแปลงอย่างละเอียด')" class="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition">🧪 คำนวณสูตรปุ๋ย & น้ำ</button>
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
                    showToast('🔑 บันทึก Gemini API Key เรียบร้อย! เชื่อมต่อตรงกับ Google Gemini 2.5 Flash');
                } else {
                    localStorage.removeItem(STORAGE_KEY_GEMINI_API);
                    showToast('🧠 ใช้สมองกล Antigravity Cloud LLM อัตโนมัติ (ไม่ต้องใช้คีย์ พร้อมใช้งาน 100%)');
                }
            } catch (e) {}
            updateAiModeBadge();
        }

        function updateAiModeBadge() {
            const savedKey = localStorage.getItem(STORAGE_KEY_GEMINI_API) || '';
            const badge = document.getElementById('aiEngineStatusBadge');
            if (badge) {
                if (savedKey) {
                    badge.textContent = '🟣 Antigravity AI (Google Gemini 2.5 Pro/Flash Direct)';
                    badge.className = 'bg-violet-100 text-violet-800 border border-violet-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full';
                } else {
                    badge.textContent = '🟢 Antigravity AI Agent (Cloud LLM อัจฉริยะ • ไม่ต้องใส่คีย์)';
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
                            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-base shrink-0 mt-0.5 shadow-sm">
                                🧠
                            </div>
                            <div class="max-w-[92%] w-full bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm space-y-1.5">
                                <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                                    <span class="text-[11px] font-extrabold text-emerald-800">Antigravity AI Agent (DeepMind Smart Brain & Live Editor)</span>
                                    <span class="text-[10px] text-slate-400">${msg.time}</span>
                                </div>
                                <div class="text-xs sm:text-sm leading-relaxed space-y-1.5">${msg.html}</div>
                            </div>
                        </div>
                    `;
                }
            }).join('') + (isAiTyping ? `
                <div class="flex items-center gap-2 text-xs text-emerald-700 font-bold pl-2 py-1">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>🧠 Antigravity AI กำลังคิดวิเคราะห์เชิงลึกและประมวลผลคำสั่ง...</span>
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
            if (!mdText) return '';
            let clean = String(mdText).replace(/<AGY_ACTION>[\s\S]*?<\/AGY_ACTION>/gi, '').trim();
            let safe = escapeHtmlText(clean);

            // Code blocks
            safe = safe.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-emerald-300 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2">$2</pre>');
            // Inline code
            safe = safe.replace(/`([^`\n]+)`/g, '<code class="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');

            // Markdown Tables
            safe = safe.replace(/((?:^\|.+\|\r?\n)+)/gm, (tableBlock) => {
                const lines = tableBlock.trim().split(/\r?\n/).filter(l => l.trim().startsWith('|'));
                if (lines.length < 2) return tableBlock;
                let htmlRows = '';
                lines.forEach((line, idx) => {
                    if (/^\|[\s\-:|]+\|$/.test(line.trim())) return;
                    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
                    const tag = idx === 0 ? 'th' : 'td';
                    const rowClass = idx === 0 ? 'bg-slate-900 text-white font-bold' : 'border-b border-slate-200 bg-white';
                    htmlRows += `<tr class="${rowClass}">` + cells.map(c => `<${tag} class="px-2.5 py-1.5 text-xs border border-slate-300">${c}</${tag}>`).join('') + `</tr>`;
                });
                return `<div class="overflow-x-auto my-2"><table class="w-full border-collapse border border-slate-300 text-left">${htmlRows}</table></div>`;
            });

            // Headings
            safe = safe.replace(/^###\s+(.+)$/gm, '<div class="font-extrabold text-slate-900 text-sm mt-2.5 mb-1">$1</div>');
            safe = safe.replace(/^##\s+(.+)$/gm, '<div class="font-extrabold text-emerald-900 text-sm sm:text-base mt-3 mb-1 border-b border-emerald-100 pb-0.5">$1</div>');
            safe = safe.replace(/^#\s+(.+)$/gm, '<div class="font-extrabold text-slate-950 text-base mt-3 mb-1">$1</div>');

            // Bold & Italic
            safe = safe.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            safe = safe.replace(/\*(.+?)\*/g, '<i>$1</i>');

            // Bullet points
            safe = safe.replace(/^\s*[-•]\s+(.+)$/gm, '<div class="pl-3 flex items-start gap-1.5"><span class="text-emerald-600 font-bold">•</span><span>$1</span></div>');
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

        // สร้างการ์ดดาวน์โหลด Excel (.xls) ทันทีเมื่อผู้ใช้ขอไฟล์ Excel
        function buildChatExcelResponseCard(rawQuestion) {
            const q = String(rawQuestion || '').toLowerCase();
            const targetPlot = findTargetPlotFromQuestion(q);
            const plotFilter = targetPlot ? String(targetPlot.id) : 'all';
            const res = exportAiExcelFile('telemetry30m', plotFilter);

            return `
                <div class="space-y-3">
                    <div class="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm space-y-2.5">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-extrabold shadow">📊</span>
                                <div>
                                    <div class="text-xs sm:text-sm font-extrabold text-emerald-950">สร้างและดาวน์โหลดไฟล์ Microsoft Excel (.xls) ให้เรียบร้อยแล้ว!</div>
                                    <div class="text-[11px] text-emerald-800">ชื่อไฟล์: <b class="font-mono">${escapeHtmlText(res.filename)}</b> • ข้อมูลครบ ${res.count} แปลง + ตารางเซนเซอร์ทุก 30 นาที</div>
                                </div>
                            </div>
                            <span class="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">AUTO-DOWNLOADED ✓</span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                            <div class="bg-white border border-emerald-200 rounded-xl p-2 text-center">
                                <div class="text-[10px] text-slate-500 font-bold">ความสูงเฉลี่ย (X̄)</div>
                                <div class="font-extrabold text-emerald-800">${res.stH.mean.toFixed(2)} ซม.</div>
                            </div>
                            <div class="bg-white border border-emerald-200 rounded-xl p-2 text-center">
                                <div class="text-[10px] text-slate-500 font-bold">จำนวนใบเฉลี่ย</div>
                                <div class="font-extrabold text-teal-800">${res.stL.mean.toFixed(1)} ใบ</div>
                            </div>
                            <div class="bg-white border border-emerald-200 rounded-xl p-2 text-center">
                                <div class="text-[10px] text-slate-500 font-bold">ความชื้นเฉลี่ย</div>
                                <div class="font-extrabold text-sky-800">${res.stM.mean.toFixed(1)}% RH</div>
                            </div>
                            <div class="bg-white border border-emerald-200 rounded-xl p-2 text-center">
                                <div class="text-[10px] text-slate-500 font-bold">รอบ 30 นาที (${res.ctx.slotTime} น.)</div>
                                <div class="font-extrabold text-indigo-800">${res.st30.mean.toFixed(2)} ${escapeHtmlText(res.ctx.metricCfg.unit)}</div>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2 pt-1">
                            <button type="button" onclick="exportAiExcelFile('telemetry30m', '${plotFilter}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm">📊 ดาวน์โหลดไฟล์ Excel (.xls) อีกครั้ง</button>
                            <button type="button" onclick="export30MinReportCSV()" class="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-2 rounded-xl">📥 โหลดไฟล์ CSV</button>
                            <button type="button" onclick="downloadAiReportWordDoc('executive', '${plotFilter}')" class="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-xl">📘 ขอไฟล์ Word (.doc) คู่กัน</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // สร้างการ์ดดาวน์โหลด Word (.doc) ทันทีเมื่อผู้ใช้ขอไฟล์ Word
        function buildChatWordResponseCard(rawQuestion) {
            const q = String(rawQuestion || '').toLowerCase();
            let repType = 'executive';
            if (q.includes('30') || q.includes('กราฟ')) repType = 'telemetry30m';
            else if (q.includes('บทที่ 4') || q.includes('บทที่ 5') || q.includes('วิจัย') || q.includes('สถิติ')) repType = 'thesis';
            else if (q.includes('สุขภาพ') || q.includes('ดิน') || q.includes('ความชื้น')) repType = 'health';
            else if (q.includes('รายได้') || q.includes('กำไร') || q.includes('คาร์บอน') || q.includes('เศรษฐกิจ')) repType = 'financial';

            const targetPlot = findTargetPlotFromQuestion(q);
            const plotFilter = targetPlot ? String(targetPlot.id) : 'all';

            populateAiReportPlotSelector();
            const { reportHtml, docTitle, refCode } = generateAiOfficialReport(repType, plotFilter);
            const wordInfo = downloadAiReportWordDoc(repType, plotFilter);

            return `
                <div class="space-y-3">
                    <div class="bg-sky-50 border-2 border-sky-400 rounded-2xl p-4 shadow-sm space-y-2.5">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center text-lg font-extrabold shadow">📘</span>
                                <div>
                                    <div class="text-xs sm:text-sm font-extrabold text-sky-950">สร้างและดาวน์โหลดไฟล์ Microsoft Word (.doc) ให้เรียบร้อยแล้ว!</div>
                                    <div class="text-[11px] text-sky-800">ชื่อไฟล์: <b class="font-mono">${escapeHtmlText(wordInfo.filename)}</b> • เปิดแก้ไขใน MS Word ได้ทันที</div>
                                </div>
                            </div>
                            <span class="bg-sky-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">AUTO-DOWNLOADED ✓</span>
                        </div>
                        <div class="flex flex-wrap gap-2 pt-1">
                            <button type="button" onclick="downloadAiReportWordDoc('${repType}', '${plotFilter}')" class="bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm">📘 ดาวน์โหลดไฟล์ Word (.doc) อีกครั้ง</button>
                            <button type="button" onclick="exportAiExcelFile('${repType}', '${plotFilter}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm">📊 ขอไฟล์ Excel (.xls) คู่กัน</button>
                            <button type="button" onclick="printAiOfficialReport()" class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl">🖨️ พิมพ์ / PDF</button>
                        </div>
                    </div>
                    <div class="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
                        ${reportHtml}
                    </div>
                </div>
            `;
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
                            <button type="button" onclick="exportAiExcelFile('${repType}', '${plotFilter}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📊 โหลด Excel (.xls)</button>
                            <button type="button" onclick="downloadAiReportWordDoc('${repType}', '${plotFilter}')" class="bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📘 โหลด Word (.doc)</button>
                            <button type="button" onclick="printAiOfficialReport()" class="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">🖨️ พิมพ์ / PDF</button>
                            <button type="button" onclick="copyAiOfficialReportText()" class="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">📋 คัดลอก</button>
                        </div>
                    </div>
                    <div class="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
                        ${reportHtml}
                    </div>
                </div>
            `;
        }

        // วิเคราะห์เชิงลึกเปรียบเทียบทุกแปลง จัดอันดับ Z-Score และอัตราการเติบโตต่อวัน
        function buildDeepComparisonAnalysisHtml() {
            const ctx = collectFullFarmAiContext();
            const ranked = [...ctx.plotDetails].sort((a, b) => (b.latest.heightCm / Math.max(1, b.latest.ageDays)) - (a.latest.heightCm / Math.max(1, a.latest.ageDays)));
            const heights = ctx.plotDetails.map(d => Number(d.latest.heightCm || 0));
            const stH = calculateStats(heights);

            const rowsHtml = ranked.map((d, i) => {
                const growthVelocity = (Number(d.latest.heightCm) / Math.max(1, Number(d.latest.ageDays))).toFixed(2);
                const zScore = stH.sd > 0 ? ((Number(d.latest.heightCm) - stH.mean) / stH.sd).toFixed(2) : '0.00';
                const statusBadge = i === 0
                    ? '<span class="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold">🏆 อันดับ 1 (โตเร็วสุด)</span>'
                    : (Number(d.latest.moisture) < 68
                        ? '<span class="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">⚠️ ควรเพิ่มความชื้น</span>'
                        : '<span class="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full text-[10px] font-bold">✅ สมบูรณ์ดี</span>');
                return `
                    <tr class="border-b border-slate-200 hover:bg-emerald-50/40">
                        <td class="py-2 px-2.5 font-extrabold text-center">#${i + 1}</td>
                        <td class="py-2 px-2.5 font-bold text-slate-900">${d.plot.icon || '🌳'} ${escapeHtmlText(d.plot.name)}</td>
                        <td class="py-2 px-2.5 text-center">${d.latest.ageDays} วัน</td>
                        <td class="py-2 px-2.5 text-right font-extrabold text-emerald-700">${Number(d.latest.heightCm).toFixed(1)} ซม.</td>
                        <td class="py-2 px-2.5 text-right font-bold text-teal-700">+${growthVelocity} ซม./วัน</td>
                        <td class="py-2 px-2.5 text-center">${d.latest.leafCount} ใบ</td>
                        <td class="py-2 px-2.5 text-center">${d.latest.moisture}% (pH ${d.latest.soilPh || 6.5})</td>
                        <td class="py-2 px-2.5 text-right font-bold text-indigo-700">${Number(d.val30m).toFixed(ctx.metricCfg.decimals)}</td>
                        <td class="py-2 px-2.5 text-center font-mono">${zScore}</td>
                        <td class="py-2 px-2.5 text-center">${statusBadge}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="space-y-3">
                    <div class="bg-emerald-950 text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div class="text-xs sm:text-sm font-extrabold text-emerald-300">🏆 ผลการวิเคราะห์เปรียบเทียบเชิงลึกและจัดอันดับการเติบโต (${ctx.plotDetails.length} แปลง)</div>
                            <div class="text-[11px] text-slate-300">คำนวณอัตราการเติบโตเฉลี่ยต่อวัน (Growth Velocity), ค่ามาตรฐาน Z-Score และเซนเซอร์รอบ ${ctx.slotTime} น.</div>
                        </div>
                        <div class="flex gap-1.5">
                            <button type="button" onclick="exportAiExcelFile('telemetry30m')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📊 โหลด Excel</button>
                            <button type="button" onclick="downloadAiReportWordDoc('executive')" class="bg-sky-400 hover:bg-sky-300 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📘 โหลด Word</button>
                        </div>
                    </div>
                    <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="w-full text-xs border-collapse text-left bg-white">
                            <thead>
                                <tr class="bg-slate-900 text-white">
                                    <th class="py-2 px-2.5 text-center">อันดับ</th>
                                    <th class="py-2 px-2.5">แปลง / ชนิดพืช</th>
                                    <th class="py-2 px-2.5 text-center">อายุ</th>
                                    <th class="py-2 px-2.5 text-right">ความสูง</th>
                                    <th class="py-2 px-2.5 text-right">อัตราโต/วัน</th>
                                    <th class="py-2 px-2.5 text-center">ใบ</th>
                                    <th class="py-2 px-2.5 text-center">ความชื้น/pH</th>
                                    <th class="py-2 px-2.5 text-right">${escapeHtmlText(ctx.metricCfg.shortLabel)}</th>
                                    <th class="py-2 px-2.5 text-center">Z-Score</th>
                                    <th class="py-2 px-2.5 text-center">สถานะวินิจฉัย</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1 text-slate-800">
                        <div>📌 <b>สรุปเชิงสถิติ (Statistical Insight):</b> ความสูงเฉลี่ยทั้งฟาร์ม <b>X̄ = ${stH.mean.toFixed(2)} ซม.</b> (S.D. = ${stH.sd.toFixed(2)}, สัมประสิทธิ์การแปรผัน CV = ${((stH.sd / Math.max(1, stH.mean)) * 100).toFixed(1)}%)</div>
                        <div>🥇 <b>แปลงที่เติบโตเร็วที่สุด:</b> <b>${escapeHtmlText(ranked[0].plot.name)}</b> ด้วยอัตราการเติบโต <b>+${(ranked[0].latest.heightCm / Math.max(1, ranked[0].latest.ageDays)).toFixed(2)} ซม./วัน</b></div>
                        <div>💡 <b>ข้อเสนอแนะเชิงวิชาการ:</b> แปลงที่มีความชื้นต่ำกว่า 70% ควรเพิ่มเวลาเปิดระบบน้ำหยดช่วง 07:00–07:30 น. และ 16:30–17:00 น. เพื่อรักษาอัตราการสังเคราะห์แสงให้สูงต่อเนื่อง</div>
                    </div>
                </div>
            `;
        }

        // คำนวณสูตรปุ๋ย N-P-K ปริมาณน้ำหยด (ลิตร/วัน) และวิธีปรับค่า pH ดินรายแปลงอย่างละเอียด
        function buildFertilizerAndIrrigationPlanHtml() {
            const ctx = collectFullFarmAiContext();
            const rowsHtml = ctx.plotDetails.map(d => {
                const age = Number(d.latest.ageDays || 28);
                const height = Number(d.latest.heightCm || 40);
                const moist = Number(d.latest.moisture || 70);
                const ph = Number(d.latest.soilPh || 6.5);

                const npkFormula = age <= 20 ? '25-7-7 (เร่งต้น-ราก)' : (age <= 45 ? '15-15-15 (บำรุงต้น-ใบสมดุล)' : '13-13-21 (เสริมโครงสร้างลำต้น)');
                const npkGramPerTree = Math.round(15 + (height * 0.45));
                const organicKg = (0.5 + (height * 0.015)).toFixed(2);
                const waterDeficit = Math.max(0, 74 - moist);
                const waterLitersPerDay = (1.8 + (height * 0.04) + (waterDeficit * 0.18)).toFixed(2);
                const phAction = ph < 6.0
                    ? `เติมโดโลไมท์ ${Math.round((6.5 - ph) * 120)} กรัม/ต้น`
                    : (ph > 6.8 ? `เติมปุ๋ยหมักอินทรีย์น้ำปรับลด pH` : 'สมดุลดีมาก (ไม่ต้องปรับ)');

                return `
                    <tr class="border-b border-slate-200 hover:bg-sky-50/40">
                        <td class="py-2 px-2.5 font-bold text-slate-900">${d.plot.icon || '🌳'} ${escapeHtmlText(d.plot.name)}</td>
                        <td class="py-2 px-2.5 text-center">${age} วัน (${height} ซม.)</td>
                        <td class="py-2 px-2.5 font-extrabold text-emerald-800">${npkFormula}</td>
                        <td class="py-2 px-2.5 text-right font-bold text-teal-800">${npkGramPerTree} กรัม/ต้น/15วัน</td>
                        <td class="py-2 px-2.5 text-right">${organicKg} กก./เดือน</td>
                        <td class="py-2 px-2.5 text-right font-extrabold text-sky-700">${waterLitersPerDay} ลิตร/วัน</td>
                        <td class="py-2 px-2.5 text-center">${ph.toFixed(1)} (${phAction})</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="space-y-3">
                    <div class="bg-sky-950 text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div class="text-xs sm:text-sm font-extrabold text-sky-300">🧪 ตารางคำนวณสูตรปุ๋ย N-P-K ปริมาณการให้น้ำหยด และการจัดการดินรายแปลง</div>
                            <div class="text-[11px] text-slate-300">คำนวณจากอายุพืช ความสูง ความชื้นสัมพัทธ์ในดิน และค่า pH จริงของแต่ละแปลง</div>
                        </div>
                        <button type="button" onclick="exportAiExcelFile('health')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📊 โหลดตาราง Excel</button>
                    </div>
                    <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="w-full text-xs border-collapse text-left bg-white">
                            <thead>
                                <tr class="bg-slate-900 text-white">
                                    <th class="py-2 px-2.5">แปลง / ชนิดพืช</th>
                                    <th class="py-2 px-2.5 text-center">อายุ & ความสูง</th>
                                    <th class="py-2 px-2.5">สูตรปุ๋ย N-P-K แนะนำ</th>
                                    <th class="py-2 px-2.5 text-right">ปริมาณปุ๋ยเคมี</th>
                                    <th class="py-2 px-2.5 text-right">ปุ๋ยอินทรีย์/หมัก</th>
                                    <th class="py-2 px-2.5 text-right">ปริมาณน้ำหยด/วัน</th>
                                    <th class="py-2 px-2.5 text-center">ค่า pH & การปรับปรุงดิน</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // พยากรณ์ผลผลิต รายได้ ต้นทุน กำไรสุทธิ และคาร์บอนเครดิต (tCO2e)
        function buildEconomicAndCarbonForecastHtml() {
            const ctx = collectFullFarmAiContext();
            let totalRev = 0;
            let totalCost = 0;
            let totalCarbon = 0;

            const rowsHtml = ctx.plotDetails.map(d => {
                const h = Number(d.latest.heightCm || 40);
                const leaves = Number(d.latest.leafCount || 16);
                const estRevenue = Math.round(12500 + (h * 210) + (leaves * 180));
                const estCost = Math.round(3200 + (h * 42));
                const netProfit = estRevenue - estCost;
                const roi = ((netProfit / estCost) * 100).toFixed(1);
                const carbonTons = Number((0.42 + (h * 0.018)).toFixed(2));
                totalRev += estRevenue;
                totalCost += estCost;
                totalCarbon += carbonTons;

                return `
                    <tr class="border-b border-slate-200 hover:bg-amber-50/40">
                        <td class="py-2 px-2.5 font-bold text-slate-900">${d.plot.icon || '🌳'} ${escapeHtmlText(d.plot.name)}</td>
                        <td class="py-2 px-2.5 text-right">${estRevenue.toLocaleString()} บาท</td>
                        <td class="py-2 px-2.5 text-right text-slate-600">${estCost.toLocaleString()} บาท</td>
                        <td class="py-2 px-2.5 text-right font-extrabold text-emerald-700">+${netProfit.toLocaleString()} บาท</td>
                        <td class="py-2 px-2.5 text-center font-bold text-amber-700">${roi}%</td>
                        <td class="py-2 px-2.5 text-right font-bold text-teal-800">${carbonTons.toFixed(2)} tCO₂e</td>
                    </tr>
                `;
            }).join('');

            const totalNet = totalRev - totalCost;
            return `
                <div class="space-y-3">
                    <div class="bg-amber-950 text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div class="text-xs sm:text-sm font-extrabold text-amber-300">💰 รายงานพยากรณ์ผลตอบแทนทางเศรษฐกิจ กำไรสุทธิ (ROI) และคาร์บอนเครดิต</div>
                            <div class="text-[11px] text-slate-300">ประเมินจากอัตราการเติบโตดัชนีมวลชีวภาพ (Biomass) และความสมบูรณ์ของแต่ละแปลง</div>
                        </div>
                        <button type="button" onclick="downloadAiReportWordDoc('financial')" class="bg-sky-400 hover:bg-sky-300 text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📘 โหลดรายงาน Word</button>
                    </div>
                    <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="w-full text-xs border-collapse text-left bg-white">
                            <thead>
                                <tr class="bg-slate-900 text-white">
                                    <th class="py-2 px-2.5">แปลงเพาะปลูก</th>
                                    <th class="py-2 px-2.5 text-right">รายได้ประเมิน</th>
                                    <th class="py-2 px-2.5 text-right">ต้นทุนสะสม</th>
                                    <th class="py-2 px-2.5 text-right">กำไรสุทธิคาดการณ์</th>
                                    <th class="py-2 px-2.5 text-center">ROI (%)</th>
                                    <th class="py-2 px-2.5 text-right">กักเก็บคาร์บอน</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                                <tr class="bg-emerald-950 text-white font-extrabold">
                                    <td class="py-2.5 px-2.5">รวมทั้งฟาร์ม (${ctx.plotDetails.length} แปลง)</td>
                                    <td class="py-2.5 px-2.5 text-right text-amber-300">${totalRev.toLocaleString()} บาท</td>
                                    <td class="py-2.5 px-2.5 text-right">${totalCost.toLocaleString()} บาท</td>
                                    <td class="py-2.5 px-2.5 text-right text-emerald-300">+${totalNet.toLocaleString()} บาท</td>
                                    <td class="py-2.5 px-2.5 text-center text-amber-300">${((totalNet / Math.max(1, totalCost)) * 100).toFixed(1)}%</td>
                                    <td class="py-2.5 px-2.5 text-right text-teal-300">${totalCarbon.toFixed(2)} tCO₂e</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        function buildLocalSmartFarmAiResponse(rawQuestion) {
            const q = rawQuestion.toLowerCase().trim();

            // 0. ตรวจสอบคำสั่งโหมดมืด/อัปเดตตัวเลขแปลง
            const liveEditResult = tryProcessRealTimeWebEdit(rawQuestion);
            if (liveEditResult) {
                return liveEditResult;
            }

            // 0.5 ขอ Excel ได้ Excel / ขอ Word ได้ Word ทันที
            if (q.includes('excel') || q.includes('เอ็กเซล') || q.includes('เอกเซล') || q.includes('.xls') || q.includes('ตาราง excel')) {
                return buildChatExcelResponseCard(rawQuestion);
            }
            if (q.includes('word') || q.includes('เวิร์ด') || q.includes('.doc') || q.includes('ไฟล์ word') || q.includes('รายงาน word')) {
                return buildChatWordResponseCard(rawQuestion);
            }

            // 0.6 วิเคราะห์เปรียบเทียบทุกแปลงเชิงลึก / จัดอันดับ
            if (q.includes('เปรียบเทียบ') || q.includes('จัดอันดับ') || q.includes('วิเคราะห์ทุกแปลง')) {
                return buildDeepComparisonAnalysisHtml();
            }

            // 0.7 คำนวณสูตรปุ๋ย N-P-K / น้ำหยด / การปรับค่า pH ดิน
            if (q.includes('ปุ๋ย') || q.includes('n-p-k') || q.includes('npk') || q.includes('น้ำหยด') || q.includes('ปรับค่า ph')) {
                return buildFertilizerAndIrrigationPlanHtml();
            }

            // 0.8 พยากรณ์ผลผลิต รายได้ กำไร คาร์บอนเครดิต
            if (q.includes('พยากรณ์') || q.includes('รายได้') || q.includes('กำไร') || q.includes('คาร์บอน') || q.includes('roi')) {
                return buildEconomicAndCarbonForecastHtml();
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
                simulateAnotherTree30Min(true);
                renderLivePlotEditorTable();
                generateAiOfficialReport();
                const newest = plots[plots.length - 1];
                aiLastMentionedPlotId = newest.id;
                return `🌱 <b>จัดให้เลยครับ! ผมสร้าง "${newest.name}" และเปิดหน้าแผนที่ดาวเทียมเพื่อให้คุณคลิกปักหมุดเรียบร้อยแล้ว</b>
                <ul class="list-disc pl-5 mt-1 space-y-0.5">
                    <li>📍 <b>พิกัดเริ่มต้นบนแผนที่ดาวเทียม:</b> ${Number(newest.lat).toFixed(4)}, ${Number(newest.lng).toFixed(4)} (คลิกจุดใหม่บนแผนที่เพื่อย้ายหมุดได้ทันที)</li>
                    <li>📈 <b>กราฟทุก 30 นาที & รายงาน:</b> เพิ่มเส้นกราฟและอัปเดตตารางรายงานให้ทันที</li>
                </ul>
                <div class="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onclick="switchTab('report30m')" class="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-lg">📈 ดูกราฟที่เพิ่งเพิ่ม</button>
                    <button type="button" onclick="startPinningTreeOnMap(${newest.id})" class="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-lg">📍 ไปคลิกปักหมุดบนแผนที่</button>
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
                return `🎨 เปลี่ยนโทนสีของเว็บไซต์เป็น <b>"${THEMES[themeKey].name}"</b> ให้เรียบร้อยแล้วครับ!`;
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
            if (q.includes('ใบเหลือง') || q.includes('ใบไหม้') || q.includes('รากเน่า') || q.includes('โรค') || q.includes('แมลง') || q.includes('หนอน') || q.includes('เพลี้ย') || q.includes('เหี่ยว') || q.includes('โตช้า') || q.includes('วินิจฉัย')) {
                return `🩺 <b>การวินิจฉัยความเสี่ยงโรคพืช แมลงศัตรูพืช และแนวทางป้องกันรักษาโดย Antigravity AI Pro:</b><br>
                <div class="space-y-2 mt-1.5 text-xs">
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <b>🍂 1. อาการใบเหลือง / ขอบใบไหม้ / โตช้า:</b>
                        <ul class="list-disc pl-4 mt-1 space-y-0.5">
                            <li><b>ใบล่างเหลืองก่อน (ขาดไนโตรเจน N):</b> แนะนำให้เสริมปุ๋ยสูตร 25-7-7 หรือ 15-15-15 อัตรา 25–35 กรัม/ต้น ร่วมกับน้ำหมักชีวภาพ</li>
                            <li><b>ใบอ่อนเหลืองแต่เส้นใบยังเขียว (ขาดธาตุเหล็ก Fe / pH สูง):</b> ตรวจสอบค่า pH ดินให้อยู่ในช่วง <b>6.0 – 6.6</b> เพื่อให้รากดูดซึมจุลธาตุได้เต็มประสิทธิภาพ</li>
                        </ul>
                    </div>
                    <div class="bg-rose-50 border border-rose-200 rounded-xl p-3">
                        <b>🦠 2. การป้องกันโรครากเน่า-โคนเน่า (Phytophthora) และแมลงกินใบ:</b>
                        <ul class="list-disc pl-4 mt-1 space-y-0.5">
                            <li>ควบคุมความชื้นดินไม่ให้ขังแฉะเกิน 80% RH และใช้เชื้อรา <b>ไตรโคเดอร์มา (Trichoderma harzianum)</b> อัตรา 50 กรัม/น้ำ 20 ลิตร ราดโคนต้นทุก 15 วัน</li>
                            <li>ป้องกันหนอนและเพลี้ยไฟด้วยสารสกัดสะเดา (Azadirachtin) หรือเชื้อราบิวเวอเรียฉีดพ่นช่วงเย็น</li>
                        </ul>
                    </div>
                </div>`;
            }

            // 6. หากถามเจาะจงถึงต้นไม้รายต้น -> แสดงข้อมูลเชิงลึกพร้อมปุ่มออกรายงานของต้นนั้น
            const targetPlot = findTargetPlotFromQuestion(q);
            if (targetPlot) {
                const detail = treeDetails.find(t => t.plot.id === targetPlot.id) || treeDetails[0];
                const rank = [...treeDetails].sort((a, b) => b.val30m - a.val30m).findIndex(t => t.plot.id === targetPlot.id) + 1;
                const velocity = (Number(detail.latest.heightCm) / Math.max(1, Number(detail.latest.ageDays))).toFixed(2);
                return `🔍 <b>ข้อมูลวิเคราะห์เชิงลึก: ${detail.plot.icon || '🌳'} ${detail.plot.name}</b><br>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1.5 text-xs space-y-1">
                    <div>📍 <b>โซนและพิกัดหมุดแผนที่:</b> ${detail.plot.zone} (Lat ${Number(detail.plot.lat || 17.394).toFixed(4)}, Lng ${Number(detail.plot.lng || 104.769).toFixed(4)})</div>
                    <div>📏 <b>การเติบโตล่าสุด:</b> อายุ <b>${detail.latest.ageDays} วัน</b> • ความสูง <b>${detail.latest.heightCm} ซม.</b> (โตเฉลี่ย <b>+${velocity} ซม./วัน</b>) • จำนวนใบ <b>${detail.latest.leafCount} ใบ</b></div>
                    <div>💧 <b>สภาพดิน:</b> ความชื้น <b>${detail.latest.moisture}% RH</b> • ค่า pH <b>${detail.latest.soilPh || 6.5}</b> • คะแนนสุขภาพ <b>${detail.healthAvg.toFixed(2)} / 5.00</b></div>
                    <div>⏱️ <b>ค่าในกราฟทุก 30 นาที (${slotTime} น.):</b> วัดค่า ${metricCfg.shortLabel} ได้ <b>${detail.val30m.toFixed(metricCfg.decimals)} ${metricCfg.unit}</b> (อันดับที่ <b>${rank}</b> จาก ${plots.length} ต้น)</div>
                </div>
                <div class="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" onclick="exportAiExcelFile('telemetry30m', '${detail.plot.id}')" class="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg">📊 โหลด Excel เฉพาะต้นนี้</button>
                    <button type="button" onclick="downloadAiReportWordDoc('executive', '${detail.plot.id}')" class="bg-sky-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg">📘 โหลด Word เฉพาะต้นนี้</button>
                    <button type="button" onclick="jumpToPlotOnMap(${detail.plot.id})" class="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-lg">🗺️ ซูมดูหมุดบนแผนที่</button>
                </div>`;
            }

            // 7. คำถามเกี่ยวกับกราฟทุก 30 นาที / สรุปผล
            if (q.includes('30') || q.includes('กราฟ') || q.includes('สรุป') || q.includes('ดีสุด')) {
                return buildChatReportResponseCard('รายงานกราฟ 30 นาที');
            }

            // 8. คำตอบวิเคราะห์ภาพรวมอัจฉริยะ
            return buildDeepComparisonAnalysisHtml();
        }

        // ประมวลผลคำสั่ง Agentic Action จาก LLM (<AGY_ACTION>{...}</AGY_ACTION>) สำหรับจัดการข้อมูลเกษตรและรายงาน
        function executeAgenticJsonActions(rawLlmText) {
            if (!rawLlmText) return '';
            const matches = [...String(rawLlmText).matchAll(/<AGY_ACTION>([\s\S]*?)<\/AGY_ACTION>/gi)];
            if (matches.length === 0) return '';
            let executedBadges = [];
            for (const m of matches) {
                try {
                    const act = JSON.parse(m[1].trim());
                    if (typeof act.darkMode === 'boolean') {
                        toggleDarkModeUI(act.darkMode);
                        executedBadges.push(act.darkMode ? `🌙 เปิดโหมดมืด` : `☀️ เปิดโหมดสว่าง`);
                    }
                    if (act.theme && typeof setAppTheme === 'function' && THEMES[act.theme]) {
                        setAppTheme(act.theme);
                        executedBadges.push(`🎨 เปลี่ยนธีมสีเป็น ${THEMES[act.theme].name}`);
                    }
                    if (act.updatePlotId && act.field && act.value !== undefined) {
                        updatePlotFieldLive(Number(act.updatePlotId), act.field, act.value);
                        renderLivePlotEditorTable();
                        executedBadges.push(`🌱 อัปเดตแปลงที่ ${act.updatePlotId} (${act.field} = ${act.value})`);
                    }
                    if (act.addTree && typeof simulateAnotherTree30Min === 'function') {
                        const customInput = document.getElementById('inputSimTreeName');
                        if (customInput && typeof act.addTree === 'string') customInput.value = act.addTree;
                        simulateAnotherTree30Min(true);
                        renderLivePlotEditorTable();
                        executedBadges.push(`🌳 เพิ่มต้นไม้ใหม่ลงระบบ`);
                    }
                    if (act.openWater && typeof triggerAllIrrigation === 'function') {
                        triggerAllIrrigation();
                        executedBadges.push(`💦 เปิดระบบน้ำหยดอัจฉริยะ`);
                    }
                    if (act.switchTab && typeof switchTab === 'function') {
                        switchTab(act.switchTab);
                        executedBadges.push(`🧭 สลับไปยังหน้า ${act.switchTab}`);
                    }
                    if (act.exportExcel) {
                        return buildChatExcelResponseCard(String(act.exportExcel));
                    }
                    if (act.exportWord) {
                        return buildChatWordResponseCard(String(act.exportWord));
                    }
                    if (act.generateReport) {
                        const card = buildChatReportResponseCard(String(act.generateReport));
                        executedBadges.push(`📑 สร้างเอกสารรายงานทางการ`);
                        return card;
                    }
                } catch (e) {}
            }
            if (executedBadges.length === 0) return '';
            return `<div class="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl px-3 py-2 text-xs font-bold mb-2 flex flex-wrap gap-1.5 items-center">
                <span>⚡ <b>Antigravity AI Action:</b></span>
                ${executedBadges.map(b => `<span class="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg">${escapeHtmlText(b)}</span>`).join('')}
            </div>`;
        }

        async function callAntigravityCloudLLM(question, systemPrompt) {
            const savedApiKey = localStorage.getItem(STORAGE_KEY_GEMINI_API) || '';
            const recentTurns = aiChatHistory.slice(-10).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: (m.plainText || m.html.replace(/<[^>]+>/g, ' ')).slice(0, 1600)
            }));

            // 1. หากผู้ใช้ใส่ Gemini API Key ไว้ ให้ยิงตรงไปยัง Google Gemini 2.5 Flash
            if (savedApiKey) {
                try {
                    const geminiTurns = recentTurns.map(t => ({
                        role: t.role === 'user' ? 'user' : 'model',
                        parts: [{ text: t.content }]
                    }));
                    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(savedApiKey)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            contents: geminiTurns,
                            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
                        })
                    });
                    const data = await resp.json();
                    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (candidateText) return candidateText;
                } catch (err) {}
            }

            // 2. เชื่อมต่ออัตโนมัติแบบ Multi-Model Cascade (openai-large -> openai -> mistral)
            const modelsToTry = ['openai-large', 'openai', 'mistral'];
            for (const modelName of modelsToTry) {
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 14000);
                    const resp = await fetch('https://text.pollinations.ai/openai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: ctrl.signal,
                        body: JSON.stringify({
                            model: modelName,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                ...recentTurns
                            ],
                            temperature: 0.4
                        })
                    });
                    clearTimeout(timer);
                    if (resp.ok) {
                        const data = await resp.json();
                        const text = data?.choices?.[0]?.message?.content;
                        if (text && text.trim()) return text.trim();
                    }
                } catch (err) {}
            }

            // 3. Fallback Cloud Endpoint สำรอง
            try {
                const ctrl2 = new AbortController();
                const timer2 = setTimeout(() => ctrl2.abort(), 10000);
                const shortSys = systemPrompt.slice(0, 750);
                const url = `https://text.pollinations.ai/${encodeURIComponent(question)}?model=openai&system=${encodeURIComponent(shortSys)}`;
                const resp2 = await fetch(url, { signal: ctrl2.signal });
                clearTimeout(timer2);
                if (resp2.ok) {
                    const text2 = await resp2.text();
                    if (text2 && text2.trim()) return text2.trim();
                }
            } catch (err2) {}

            return null;
        }

        async function askSmartFarmAI(sourceInputId, presetQuestionText) {
            const inputEl = sourceInputId ? document.getElementById(sourceInputId) : null;
            const question = (presetQuestionText || (inputEl ? inputEl.value : '') || '').trim();
            if (!question) {
                showToast('กรุณาพิมพ์คำถามหรือคำสั่งให้ Antigravity AI Pro ครับ');
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
            const instantWebEditHtml = tryProcessRealTimeWebEdit(question);
            if (instantWebEditHtml) {
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: instantWebEditHtml.replace(/<[^>]+>/g, ' '),
                    html: instantWebEditHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText(instantWebEditHtml);
                return;
            }

            // ขอ Excel ได้ Excel ทันที!
            const isExcelRequest =
                qLower.includes('excel') || qLower.includes('เอ็กเซล') ||
                qLower.includes('เอกเซล') || qLower.includes('.xls') ||
                qLower.includes('ตาราง excel');

            if (isExcelRequest) {
                const excelCardHtml = buildChatExcelResponseCard(question);
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'สร้างและดาวน์โหลดไฟล์ตาราง Microsoft Excel (.xls) พร้อมข้อมูลสถิติทุกแปลงให้เรียบร้อยแล้วครับ',
                    html: excelCardHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText('สร้างและดาวน์โหลดไฟล์ตาราง Excel ให้เรียบร้อยแล้วครับ');
                return;
            }

            // ขอ Word ได้ Word ทันที!
            const isWordRequest =
                qLower.includes('word') || qLower.includes('เวิร์ด') ||
                qLower.includes('.doc') || qLower.includes('ไฟล์ word') ||
                qLower.includes('รายงาน word');

            if (isWordRequest) {
                const wordCardHtml = buildChatWordResponseCard(question);
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'สร้างและดาวน์โหลดไฟล์เอกสาร Microsoft Word (.doc) ฉบับสมบูรณ์ให้เรียบร้อยแล้วครับ',
                    html: wordCardHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText('สร้างและดาวน์โหลดไฟล์เอกสาร Word ให้เรียบร้อยแล้วครับ');
                return;
            }

            // คำถามวิเคราะห์เชิงลึกเฉพาะทาง (แสดงตารางคำนวณทันที 0 วินาที!)
            if (qLower.includes('เปรียบเทียบ') || qLower.includes('จัดอันดับ') || qLower.includes('วิเคราะห์ทุกแปลง')) {
                const compHtml = buildDeepComparisonAnalysisHtml();
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'วิเคราะห์เปรียบเทียบเชิงลึกและจัดอันดับการเติบโตของทุกแปลงเรียบร้อยแล้วครับ',
                    html: compHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText('วิเคราะห์เปรียบเทียบเชิงลึกและจัดอันดับการเติบโตของทุกแปลงให้เรียบร้อยแล้วครับ');
                return;
            }

            if (qLower.includes('คำนวณสูตรปุ๋ย') || qLower.includes('คำนวณปุ๋ย') || qLower.includes('n-p-k') || qLower.includes('ปริมาณน้ำหยด')) {
                const fertHtml = buildFertilizerAndIrrigationPlanHtml();
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'คำนวณสูตรปุ๋ย N-P-K ปริมาณน้ำหยด และวิธีปรับค่า pH ดินของแต่ละแปลงให้เรียบร้อยแล้วครับ',
                    html: fertHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText('คำนวณสูตรปุ๋ยและปริมาณน้ำหยดรายแปลงให้เรียบร้อยแล้วครับ');
                return;
            }

            if (qLower.includes('พยากรณ์ผลผลิต') || qLower.includes('พยากรณ์รายได้') || qLower.includes('คาร์บอนเครดิต')) {
                const econHtml = buildEconomicAndCarbonForecastHtml();
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'พยากรณ์ผลผลิต รายได้ กำไรสุทธิ และคาร์บอนเครดิตของทั้งฟาร์มให้เรียบร้อยแล้วครับ',
                    html: econHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText('พยากรณ์ผลผลิต รายได้ และคาร์บอนเครดิตของทั้งฟาร์มให้เรียบร้อยแล้วครับ');
                return;
            }

            const isDirectReportRequest =
                qLower.includes('ขอรายงาน') || qLower.includes('ออกรายงาน') ||
                qLower.includes('สร้างรายงาน') || qLower.includes('รายงานสรุป') ||
                qLower.includes('รายงานกราฟ') || qLower.includes('บทที่ 4') || qLower.includes('บทที่ 5');

            if (isDirectReportRequest) {
                const reportCardHtml = buildChatReportResponseCard(question);
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: 'จัดทำเอกสารรายงานฉบับสมบูรณ์พร้อมตารางสถิติและปุ่มพิมพ์ PDF / ดาวน์โหลด Word / Excel เรียบร้อยแล้วครับ',
                    html: reportCardHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText('จัดทำเอกสารรายงานฉบับสมบูรณ์ให้เรียบร้อยแล้วครับ');
                return;
            }

            isAiTyping = true;
            renderAiChatMessages();

            const slotTime = typeof currentActive30MinSlot !== 'undefined' ? currentActive30MinSlot : '12:00';
            const metricKey = typeof current30MinMetric !== 'undefined' ? current30MinMetric : 'growthRate';
            const heightsAll = plots.map(p => {
                const l = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays)[0];
                return Number(l?.heightCm || 40);
            });
            const stHeight = calculateStats(heightsAll);
            const farmContext = plots.map(p => {
                const pLogs = logs.filter(r => r.plotId === p.id).sort((a, b) => b.ageDays - a.ageDays);
                const latest = pLogs[0] || {};
                const age = Number(latest.ageDays || 28);
                const h = Number(latest.heightCm || 40);
                const vel = (h / Math.max(1, age)).toFixed(2);
                const val30 = (typeof telemetry30MinStore !== 'undefined' && telemetry30MinStore[p.id] && telemetry30MinStore[p.id][metricKey])
                    ? telemetry30MinStore[p.id][metricKey][slotTime]
                    : '-';
                return `[แปลงที่ ${p.id}] ${p.name} (โซน: ${p.zone}, พิกัด ${p.lat},${p.lng}): อายุ ${age} วัน, ความสูง ${h} ซม. (อัตราโต +${vel} ซม./วัน), จำนวนใบ ${latest.leafCount || 16} ใบ, ความชื้นดิน ${latest.moisture || 70}%, pH ${latest.soilPh || 6.5}, อัตราเติบโตรอบ 30 นาที (${slotTime} น.) = ${val30}`;
            }).join('\n');

            const systemPrompt = `คุณคือ "Antigravity AI Pro 5.0" สมองกลอัจฉริยะระดับผู้เชี่ยวชาญด้านเกษตรแม่นยำ (Precision Agriculture), วิทยาศาสตร์ข้อมูล (Data Science), สถิติวิจัย และความรู้รอบตัวทุกแขนง ประจำเว็บไซต์ "ติดตามการเติบโตพืชผล (AgriGrow Nakhon Phanom)"
แนวทางการตอบ:
1. ตอบอย่างฉลาดลึกซึ้ง แม่นยำ มีเหตุผลรองรับ และจัดรูปแบบให้อ่านง่ายด้วยหัวข้อชัดเจน, ตาราง Markdown (เมื่อเปรียบเทียบข้อมูล), สูตรคำนวณ และข้อเสนอแนะที่นำไปใช้ได้จริง
2. ข้อมูลจริงของแปลงปลูกในระบบขณะนี้ (${plots.length} แปลง, ความสูงเฉลี่ย X̄ = ${stHeight.mean.toFixed(2)} ซม., S.D. = ${stHeight.sd.toFixed(2)}, รอบเวลาทุก 30 นาทีล่าสุดคือ ${slotTime} น.):
${farmContext}
3. หากผู้ใช้ต้องการไฟล์หรือสั่งควบคุมฟาร์ม ให้แนบแท็กคำสั่งไว้ท้ายคำตอบได้:
- ดาวน์โหลด Excel: <AGY_ACTION>{"exportExcel":"telemetry30m"}</AGY_ACTION>
- ดาวน์โหลด Word: <AGY_ACTION>{"exportWord":"executive"}</AGY_ACTION>
- ออกรายงานทางการ: <AGY_ACTION>{"generateReport":"executive"}</AGY_ACTION>
- เพิ่มต้นไม้ใหม่: <AGY_ACTION>{"addTree":"กล้าไม้พะยูง"}</AGY_ACTION>
- เปิดน้ำทุกแปลง: <AGY_ACTION>{"openWater":true}</AGY_ACTION>`;

            const llmReply = await callAntigravityCloudLLM(question, systemPrompt);
            if (llmReply) {
                isAiTyping = false;
                const actionBannerHtml = executeAgenticJsonActions(llmReply);
                const formattedBody = formatMarkdownToHtml(llmReply);
                const quickExportFooter = `
                    <div class="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        <button type="button" onclick="exportAiExcelFile('telemetry30m')" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📊 ส่งออกข้อมูลเป็น Excel (.xls)</button>
                        <button type="button" onclick="downloadAiReportWordDoc('executive')" class="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">📘 ส่งออกรายงานเป็น Word (.doc)</button>
                    </div>
                `;
                const combinedHtml = actionBannerHtml + formattedBody + quickExportFooter;
                aiChatHistory.push({
                    role: 'ai',
                    time: getCurrentTimeShort(),
                    plainText: llmReply.replace(/<AGY_ACTION>[\s\S]*?<\/AGY_ACTION>/gi, '').trim(),
                    html: combinedHtml
                });
                renderAiChatMessages();
                renderAiLiveDiagnostics();
                speakAiText(llmReply);
                return;
            }

            // Fallback กรณีไม่มีอินเทอร์เน็ต
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
