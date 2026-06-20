document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }

        themeToggle.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            
            if (isDark) {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggle.textContent = '🌙';
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggle.textContent = '☀️';
            }
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    function closeMenu() {
        if(sidebar) sidebar.classList.remove('open');
        if(overlay) overlay.classList.remove('show');
    }

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            overlay.classList.add('show');
        });
        closeMenuBtn.addEventListener('click', closeMenu);
        overlay.addEventListener('click', closeMenu);
    }

    const navButtons = document.querySelectorAll('.nav-btn');
    const toolSections = document.querySelectorAll('.tool-section');
    const currentToolTitle = document.getElementById('currentToolTitle');
    const globalBackBtn = document.getElementById('globalBackBtn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const isSpecialPage = targetId === 'about' || targetId === 'privacy';
            
            if (!isSpecialPage && targetId !== 'standard') {
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }

            toolSections.forEach(s => s.classList.remove('active-tool'));
            
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.classList.add('active-tool');
                
                if (targetId === 'standard') {
                    if (currentToolTitle) currentToolTitle.textContent = "Main Calculator";
                    if (globalBackBtn) globalBackBtn.style.display = 'none';
                    navButtons.forEach(b => b.classList.remove('active'));
                } else {
                    if (currentToolTitle && !isSpecialPage) {
                        currentToolTitle.textContent = btn.textContent.trim();
                    }
                    if (globalBackBtn) globalBackBtn.style.display = 'block';
                }
            } else {
                const fallbackSection = document.getElementById('standard');
                if (fallbackSection) fallbackSection.classList.add('active-tool');
                if (currentToolTitle) currentToolTitle.textContent = "Main Calculator";
                if (globalBackBtn) globalBackBtn.style.display = 'none';
            }
            
            closeMenu();
        });
    });

    const toolSearch = document.getElementById('toolSearch');
    if (toolSearch) {
        toolSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const searchNavs = document.querySelectorAll('#toolList .nav-btn');
            searchNavs.forEach(btn => {
                const text = btn.textContent.toLowerCase();
                btn.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }

    const globalHistoryList = document.getElementById('globalHistoryList');
    
    function getHistory() {
        try {
            let data = localStorage.getItem('calcHistory');
            let parsed = data ? JSON.parse(data) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            localStorage.removeItem('calcHistory'); 
            return [];
        }
    }

    function renderHistory() {
        if (!globalHistoryList) return;
        const history = getHistory();
        globalHistoryList.innerHTML = '';
        
        if (history.length === 0) {
            globalHistoryList.innerHTML = '<li style="text-align:center; color:var(--text-muted); border:none; background:none; padding-top: 20px;">No history yet.</li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.style.transition = 'opacity 0.2s';
            
            li.addEventListener('mousedown', () => li.style.opacity = '0.5');
            li.addEventListener('mouseup', () => li.style.opacity = '1');
            li.addEventListener('mouseleave', () => li.style.opacity = '1');

            li.innerHTML = `
                <div style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 5px;">
                    <strong>${item.toolName || 'Log'}</strong> • ${item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                </div>
                <div style="font-size: 1.1em;">
                    ${item.operation} = <strong style="color: var(--accent);">${item.result}</strong>
                </div>
            `;

            li.addEventListener('click', () => {
                let target = '';
                if (item.toolName === 'Math') target = 'standard';
                else if (item.toolName === 'BMI') target = 'bmi';
                else if (item.toolName === 'FX') target = 'currency';
                else if (item.toolName === 'Age') target = 'age-calc';

                if (target) {
                    let navBtn;
                    if(target === 'standard') navBtn = document.getElementById('globalBackBtn');
                    else navBtn = document.querySelector(`.nav-btn[data-target="${target}"]`);
                    
                    if (navBtn) navBtn.click();

                    if (item.toolName === 'Math') {
                        document.dispatchEvent(new CustomEvent('resumeMath', { 
                            detail: { result: item.result, operation: item.operation } 
                        }));
                    }
                }
            });

            globalHistoryList.appendChild(li);
        });
    }

    function saveToHistory(toolName, operation, result) {
        let history = getHistory();
        history.unshift({ toolName, operation, result, timestamp: new Date().toISOString() });
        if (history.length > 20) history.pop();
        localStorage.setItem('calcHistory', JSON.stringify(history));
        renderHistory();
    }

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            localStorage.removeItem('calcHistory');
            renderHistory();
        });
    }

    renderHistory();

    const calcDisplay = document.getElementById('calcDisplay');
    const calcHistory = document.getElementById('calcHistory');
    const memoryIndicator = document.getElementById('memoryIndicator');
    const keys = document.querySelectorAll('.key');

    if (calcDisplay && keys.length > 0) {
        let currentOperand = '0';
        let previousOperand = '';
        let currentOperation = null;
        let shouldResetDisplay = false;
        let memoryValue = 0;

        function updateDisplay() {
            calcDisplay.textContent = currentOperand;
            if (calcHistory) {
                calcHistory.textContent = currentOperation ? `${previousOperand} ${currentOperation}` : '';
            }
        }

        document.addEventListener('resumeMath', (e) => {
            currentOperand = e.detail.result.toString();
            previousOperand = '';
            currentOperation = null;
            shouldResetDisplay = true;
            calcDisplay.textContent = currentOperand;
            if (calcHistory) calcHistory.textContent = `${e.detail.operation} =`;
        });

        function appendNumber(number) {
            if (currentOperand === '0' || shouldResetDisplay) {
                currentOperand = number;
                shouldResetDisplay = false;
            } else {
                if (number === '.' && currentOperand.includes('.')) return;
                currentOperand += number;
            }
        }

        function compute() {
            let computation;
            const prev = parseFloat(previousOperand);
            const current = parseFloat(currentOperand);
            if (isNaN(prev) || isNaN(current)) return;

            switch (currentOperation) {
                case '+': computation = prev + current; break;
                case '-': computation = prev - current; break;
                case '*': computation = prev * current; break;
                case '/': 
                    if (current === 0) {
                        currentOperand = 'Error';
                        previousOperand = '';
                        currentOperation = null;
                        return;
                    }
                    computation = prev / current; 
                    break;
                case '%': computation = prev % current; break;
                default: return;
            }

            saveToHistory('Math', `${prev} ${currentOperation} ${current}`, computation);
            currentOperand = computation.toString();
            currentOperation = null;
            previousOperand = '';
            shouldResetDisplay = true;
        }

        keys.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                
                if (action === 'mc') {
                    memoryValue = 0;
                    if(memoryIndicator) memoryIndicator.style.opacity = '0';
                }
                if (action === 'mr') {
                    currentOperand = memoryValue.toString();
                    shouldResetDisplay = true;
                    updateDisplay();
                }
                if (action === 'm-plus') {
                    memoryValue += parseFloat(currentOperand || 0);
                    if(memoryIndicator && memoryValue !== 0) memoryIndicator.style.opacity = '1';
                    shouldResetDisplay = true;
                }
                if (action === 'm-minus') {
                    memoryValue -= parseFloat(currentOperand || 0);
                    if(memoryIndicator && memoryValue !== 0) memoryIndicator.style.opacity = '1';
                    else if (memoryIndicator) memoryIndicator.style.opacity = '0';
                    shouldResetDisplay = true;
                }

                if (button.classList.contains('number')) {
                    appendNumber(button.getAttribute('data-val'));
                    updateDisplay();
                }
                if (button.classList.contains('operator')) {
                    if (currentOperand === '') return;
                    if (previousOperand !== '') compute();
                    currentOperation = button.getAttribute('data-val');
                    previousOperand = currentOperand;
                    shouldResetDisplay = true;
                    updateDisplay();
                }
                if (action === 'calculate') {
                    compute();
                    updateDisplay();
                }
                if (action === 'clear') {
                    currentOperand = '0';
                    previousOperand = '';
                    currentOperation = null;
                    updateDisplay();
                }
                if (action === 'delete') {
                    if (currentOperand === 'Error' || shouldResetDisplay) return;
                    currentOperand = currentOperand.toString().slice(0, -1);
                    if (currentOperand === '') currentOperand = '0';
                    updateDisplay();
                }
            });
        });
    }

    const calcBmiBtn = document.getElementById('calcBmiBtn');
    if (calcBmiBtn) {
        calcBmiBtn.addEventListener('click', () => {
            const age = parseInt(document.getElementById('ageInput').value);
            const height = parseFloat(document.getElementById('heightInput').value) / 100;
            const weight = parseFloat(document.getElementById('weightInput').value);
            const bmiResult = document.getElementById('bmiResult');

            if (isNaN(age) || age <= 0 || isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
                if(bmiResult) {
                    bmiResult.textContent = 'Invalid input';
                    bmiResult.className = 'result-box';
                }
                return;
            }

            const bmi = (weight / (height * height)).toFixed(1);
            let category = '';
            let colorClass = '';

            if (bmi < 18.5) {
                category = 'Underweight';
                colorClass = 'bmi-underweight';
            } else if (bmi < 25) {
                category = 'Normal';
                colorClass = 'bmi-normal';
            } else if (bmi < 30) {
                category = 'Overweight';
                colorClass = 'bmi-overweight';
            } else {
                category = 'Obese';
                colorClass = 'bmi-obese';
            }

            if(bmiResult) {
                bmiResult.textContent = `BMI: ${bmi} (${category})`;
                bmiResult.className = `result-box ${colorClass}`;
            }
            
            saveToHistory('BMI', `${weight}kg / ${height}m`, bmi);
        });
    }

    const dobInput = document.getElementById('dobInput');
    const calcAgeBtn = document.getElementById('calcAgeBtn');
    
    if (dobInput) {
        const todayStr = new Date().toISOString().split('T')[0];
        dobInput.max = todayStr;
    }

    if (calcAgeBtn) {
        calcAgeBtn.addEventListener('click', () => {
            const dobVal = dobInput.value;
            const ageResult = document.getElementById('ageResult');
            
            if (!dobVal) {
                ageResult.textContent = 'Please select a valid date.';
                return;
            }

            const dob = new Date(dobVal);
            const today = new Date();

            let years = today.getFullYear() - dob.getFullYear();
            let months = today.getMonth() - dob.getMonth();
            let days = today.getDate() - dob.getDate();

            if (days < 0) {
                months--;
                const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                days += prevMonth.getDate();
            }

            if (months < 0) {
                years--;
                months += 12;
            }

            ageResult.innerHTML = `
                <strong style="color:var(--accent); font-size: 2rem;">${years}</strong> Years<br>
                <strong style="color:var(--accent); font-size: 2rem;">${months}</strong> Months<br>
                <strong style="color:var(--accent); font-size: 2rem;">${days}</strong> Days
            `;

            saveToHistory('Age', `DOB: ${dobVal}`, `${years}y ${months}m`);
        });
    }

    
    const currencyData = {
        "AED": { name: "🇦🇪 UAE Dirham", symbol: "د.إ", rate: 3.67 },
        "AFN": { name: "🇦🇫 Afghan Afghani", symbol: "؋", rate: 71.50 },
        "ALL": { name: "🇦🇱 Albanian Lek", symbol: "L", rate: 93.00 },
        "AMD": { name: "🇦🇲 Armenian Dram", symbol: "֏", rate: 388.00 },
        "ANG": { name: "🇨🇼 Neth. Antillean Guilder", symbol: "ƒ", rate: 1.79 },
        "AOA": { name: "🇦🇴 Angolan Kwanza", symbol: "Kz", rate: 855.00 },
        "ARS": { name: "🇦🇷 Argentine Peso", symbol: "$", rate: 890.00 },
        "AUD": { name: "🇦🇺 Australian Dollar", symbol: "A$", rate: 1.50 },
        "AWG": { name: "🇦🇼 Aruban Florin", symbol: "ƒ", rate: 1.79 },
        "AZN": { name: "🇦🇿 Azerbaijani Manat", symbol: "₼", rate: 1.70 },
        "BAM": { name: "🇧🇦 Bosnia-Herz. Mark", symbol: "KM", rate: 1.80 },
        "BBD": { name: "🇧🇧 Barbadian Dollar", symbol: "$", rate: 2.00 },
        "BDT": { name: "🇧🇩 Bangladeshi Taka", symbol: "৳", rate: 117.00 },
        "BGN": { name: "🇧🇬 Bulgarian Lev", symbol: "лв", rate: 1.80 },
        "BHD": { name: "🇧🇭 Bahraini Dinar", symbol: ".د.ب", rate: 0.376 },
        "BIF": { name: "🇧🇮 Burundian Franc", symbol: "FBu", rate: 2860.00 },
        "BMD": { name: "🇧🇲 Bermudian Dollar", symbol: "$", rate: 1.00 },
        "BND": { name: "🇧🇳 Brunei Dollar", symbol: "$", rate: 1.35 },
        "BOB": { name: "🇧🇴 Bolivian Boliviano", symbol: "Bs.", rate: 6.90 },
        "BRL": { name: "🇧🇷 Brazilian Real", symbol: "R$", rate: 5.15 },
        "BSD": { name: "🇧🇸 Bahamian Dollar", symbol: "$", rate: 1.00 },
        "BTN": { name: "🇧🇹 Bhutanese Ngultrum", symbol: "Nu.", rate: 83.50 },
        "BWP": { name: "🇧🇼 Botswana Pula", symbol: "P", rate: 13.60 },
        "BYN": { name: "🇧🇾 Belarusian Ruble", symbol: "Br", rate: 3.27 },
        "BZD": { name: "🇧🇿 Belize Dollar", symbol: "BZ$", rate: 2.01 },
        "CAD": { name: "🇨🇦 Canadian Dollar", symbol: "C$", rate: 1.36 },
        "CDF": { name: "🇨🇩 Congolese Franc", symbol: "FC", rate: 2780.00 },
        "CHF": { name: "🇨🇭 Swiss Franc", symbol: "CHF", rate: 0.91 },
        "CLP": { name: "🇨🇱 Chilean Peso", symbol: "$", rate: 905.00 },
        "CNY": { name: "🇨🇳 Chinese Yuan", symbol: "¥", rate: 7.23 },
        "COP": { name: "🇨🇴 Colombian Peso", symbol: "$", rate: 3880.00 },
        "CRC": { name: "🇨🇷 Costa Rican Colón", symbol: "₡", rate: 512.00 },
        "CUP": { name: "🇨🇺 Cuban Peso", symbol: "$", rate: 24.00 },
        "CVE": { name: "🇨🇻 Cape Verdean Escudo", symbol: "$", rate: 101.50 },
        "CZK": { name: "🇨🇿 Czech Koruna", symbol: "Kč", rate: 22.80 },
        "DJF": { name: "🇩🇯 Djiboutian Franc", symbol: "Fdj", rate: 177.72 },
        "DKK": { name: "🇩🇰 Danish Krone", symbol: "kr", rate: 6.87 },
        "DOP": { name: "🇩🇴 Dominican Peso", symbol: "RD$", rate: 58.50 },
        "DZD": { name: "🇩🇿 Algerian Dinar", symbol: "د.ج", rate: 134.50 },
        "EGP": { name: "🇪🇬 Egyptian Pound", symbol: "£", rate: 47.20 },
        "ERN": { name: "🇪🇷 Eritrean Nakfa", symbol: "Nfk", rate: 15.00 },
        "ETB": { name: "🇪🇹 Ethiopian Birr", symbol: "Br", rate: 57.00 },
        "EUR": { name: "🇪🇺 Euro", symbol: "€", rate: 0.92 },
        "FJD": { name: "🇫🇯 Fijian Dollar", symbol: "FJ$", rate: 2.26 },
        "FKP": { name: "🇫🇰 Falkland Islands Pound", symbol: "£", rate: 0.79 },
        "FOK": { name: "🇫🇴 Faroese Króna", symbol: "kr", rate: 6.87 },
        "GBP": { name: "🇬🇧 British Pound", symbol: "£", rate: 0.79 },
        "GEL": { name: "🇬🇪 Georgian Lari", symbol: "₾", rate: 2.68 },
        "GGP": { name: "🇬🇬 Guernsey Pound", symbol: "£", rate: 0.79 },
        "GHS": { name: "🇬🇭 Ghanaian Cedi", symbol: "GH₵", rate: 14.20 },
        "GIP": { name: "🇬🇮 Gibraltar Pound", symbol: "£", rate: 0.79 },
        "GMD": { name: "🇬🇲 Gambian Dalasi", symbol: "D", rate: 67.50 },
        "GNF": { name: "🇬🇳 Guinean Franc", symbol: "FG", rate: 8580.00 },
        "GTQ": { name: "🇬🇹 Guatem
