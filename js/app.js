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

    // 100% Offline Currency Data Database (Relative to 1 USD) - EVERY COUNTRY
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
        "GTQ": { name: "🇬🇹 Guatemalan Quetzal", symbol: "Q", rate: 7.78 },
        "GYD": { name: "🇬🇾 Guyanese Dollar", symbol: "$", rate: 209.00 },
        "HKD": { name: "🇭🇰 Hong Kong Dollar", symbol: "HK$", rate: 7.81 },
        "HNL": { name: "🇭🇳 Honduran Lempira", symbol: "L", rate: 24.60 },
        "HTG": { name: "🇭🇹 Haitian Gourde", symbol: "G", rate: 132.00 },
        "HUF": { name: "🇭🇺 Hungarian Forint", symbol: "Ft", rate: 358.00 },
        "IDR": { name: "🇮🇩 Indonesian Rupiah", symbol: "Rp", rate: 16000.00 },
        "ILS": { name: "🇮🇱 Israeli New Shekel", symbol: "₪", rate: 3.72 },
        "IMP": { name: "🇮🇲 Manx Pound", symbol: "£", rate: 0.79 },
        "INR": { name: "🇮🇳 Indian Rupee", symbol: "₹", rate: 83.50 },
        "IQD": { name: "🇮🇶 Iraqi Dinar", symbol: "ع.د", rate: 1310.00 },
        "IRR": { name: "🇮🇷 Iranian Rial", symbol: "﷼", rate: 42000.00 },
        "ISK": { name: "🇮🇸 Icelandic Króna", symbol: "kr", rate: 139.00 },
        "JEP": { name: "🇯🇪 Jersey Pound", symbol: "£", rate: 0.79 },
        "JMD": { name: "🇯🇲 Jamaican Dollar", symbol: "J$", rate: 156.00 },
        "JOD": { name: "🇯🇴 Jordanian Dinar", symbol: "د.ا", rate: 0.709 },
        "JPY": { name: "🇯🇵 Japanese Yen", symbol: "¥", rate: 155.00 },
        "KES": { name: "🇰🇪 Kenyan Shilling", symbol: "KSh", rate: 131.00 },
        "KGS": { name: "🇰🇬 Kyrgyzstani Som", symbol: "лв", rate: 88.00 },
        "KHR": { name: "🇰🇭 Cambodian Riel", symbol: "៛", rate: 4080.00 },
        "KID": { name: "🇰🇮 Kiribati Dollar", symbol: "$", rate: 1.50 },
        "KMF": { name: "🇰🇲 Comorian Franc", symbol: "CF", rate: 454.00 },
        "KPW": { name: "🇰🇵 North Korean Won", symbol: "₩", rate: 900.00 },
        "KRW": { name: "🇰🇷 South Korean Won", symbol: "₩", rate: 1360.00 },
        "KWD": { name: "🇰🇼 Kuwaiti Dinar", symbol: "د.ك", rate: 0.308 },
        "KYD": { name: "🇰🇾 Cayman Islands Dollar", symbol: "$", rate: 0.83 },
        "KZT": { name: "🇰🇿 Kazakhstani Tenge", symbol: "₸", rate: 440.00 },
        "LAK": { name: "🇱🇦 Lao Kip", symbol: "₭", rate: 21300.00 },
        "LBP": { name: "🇱🇧 Lebanese Pound", symbol: "£", rate: 89500.00 },
        "LKR": { name: "🇱🇰 Sri Lankan Rupee", symbol: "Rs", rate: 300.00 },
        "LRD": { name: "🇱🇷 Liberian Dollar", symbol: "$", rate: 193.00 },
        "LSL": { name: "🇱🇸 Lesotho Loti", symbol: "L", rate: 18.20 },
        "LYD": { name: "🇱🇾 Libyan Dinar", symbol: "ل.د", rate: 4.85 },
        "MAD": { name: "🇲🇦 Moroccan Dirham", symbol: "د.م.", rate: 10.05 },
        "MDL": { name: "🇲🇩 Moldovan Leu", symbol: "L", rate: 17.70 },
        "MGA": { name: "🇲🇬 Malagasy Ariary", symbol: "Ar", rate: 4430.00 },
        "MKD": { name: "🇲🇰 Macedonian Denar", symbol: "ден", rate: 56.60 },
        "MMK": { name: "🇲🇲 Myanmar Kyat", symbol: "K", rate: 2100.00 },
        "MNT": { name: "🇲🇳 Mongolian Tögrög", symbol: "₮", rate: 3380.00 },
        "MOP": { name: "🇲🇴 Macanese Pataca", symbol: "P", rate: 8.05 },
        "MRU": { name: "🇲🇷 Mauritanian Ouguiya", symbol: "UM", rate: 39.50 },
        "MUR": { name: "🇲🇺 Mauritian Rupee", symbol: "₨", rate: 46.20 },
        "MVR": { name: "🇲🇻 Maldivian Rufiyaa", symbol: "Rf", rate: 15.40 },
        "MWK": { name: "🇲🇼 Malawian Kwacha", symbol: "MK", rate: 1730.00 },
        "MXN": { name: "🇲🇽 Mexican Peso", symbol: "$", rate: 16.70 },
        "MYR": { name: "🇲🇾 Malaysian Ringgit", symbol: "RM", rate: 4.70 },
        "MZN": { name: "🇲🇿 Mozambican Metical", symbol: "MT", rate: 63.80 },
        "NAD": { name: "🇳🇦 Namibian Dollar", symbol: "$", rate: 18.20 },
        "NGN": { name: "🇳🇬 Nigerian Naira", symbol: "₦", rate: 1350.00 },
        "NIO": { name: "🇳🇮 Nicaraguan Córdoba", symbol: "C$", rate: 36.80 },
        "NOK": { name: "🇳🇴 Norwegian Krone", symbol: "kr", rate: 10.50 },
        "NPR": { name: "🇳🇵 Nepalese Rupee", symbol: "रू", rate: 133.50 },
        "NZD": { name: "🇳🇿 New Zealand Dollar", symbol: "NZ$", rate: 1.63 },
        "OMR": { name: "🇴🇲 Omani Rial", symbol: "ر.ع.", rate: 0.385 },
        "PAB": { name: "🇵🇦 Panamanian Balboa", symbol: "B/.", rate: 1.00 },
        "PEN": { name: "🇵🇪 Peruvian Sol", symbol: "S/", rate: 3.72 },
        "PGK": { name: "🇵🇬 Papua New Guinean Kina", symbol: "K", rate: 3.86 },
        "PHP": { name: "🇵🇭 Philippine Peso", symbol: "₱", rate: 57.50 },
        "PKR": { name: "🇵🇰 Pakistani Rupee", symbol: "₨", rate: 278.00 },
        "PLN": { name: "🇵🇱 Polish Złoty", symbol: "zł", rate: 3.95 },
        "PYG": { name: "🇵🇾 Paraguayan Guaraní", symbol: "₲", rate: 7500.00 },
        "QAR": { name: "🇶🇦 Qatari Riyal", symbol: "ر.ق", rate: 3.64 },
        "RON": { name: "🇷🇴 Romanian Leu", symbol: "lei", rate: 4.60 },
        "RSD": { name: "🇷🇸 Serbian Dinar", symbol: "дин", rate: 108.00 },
        "RUB": { name: "🇷🇺 Russian Ruble", symbol: "₽", rate: 90.00 },
        "RWF": { name: "🇷🇼 Rwandan Franc", symbol: "FRw", rate: 1300.00 },
        "SAR": { name: "🇸🇦 Saudi Riyal", symbol: "﷼", rate: 3.75 },
        "SBD": { name: "🇸🇧 Solomon Islands Dollar", symbol: "$", rate: 8.50 },
        "SCR": { name: "🇸🇨 Seychellois Rupee", symbol: "₨", rate: 13.60 },
        "SDG": { name: "🇸🇩 Sudanese Pound", symbol: "ج.س.", rate: 600.00 },
        "SEK": { name: "🇸🇪 Swedish Krona", symbol: "kr", rate: 10.60 },
        "SGD": { name: "🇸🇬 Singapore Dollar", symbol: "S$", rate: 1.35 },
        "SHP": { name: "🇸🇭 Saint Helena Pound", symbol: "£", rate: 0.79 },
        "SLE": { name: "🇸🇱 Sierra Leonean Leone", symbol: "Le", rate: 22.50 },
        "SOS": { name: "🇸🇴 Somali Shilling", symbol: "Sh", rate: 570.00 },
        "SRD": { name: "🇸🇷 Surinamese Dollar", symbol: "$", rate: 32.50 },
        "SSP": { name: "🇸🇸 South Sudanese Pound", symbol: "£", rate: 130.00 },
        "STN": { name: "🇸🇹 São Tomé Príncipe Dobra", symbol: "Db", rate: 22.70 },
        "SYP": { name: "🇸🇾 Syrian Pound", symbol: "£", rate: 13000.00 },
        "SZL": { name: "🇸🇿 Swazi Lilangeni", symbol: "L", rate: 18.20 },
        "THB": { name: "🇹🇭 Thai Baht", symbol: "฿", rate: 36.50 },
        "TJS": { name: "🇹🇯 Tajikistani Somoni", symbol: "ЅМ", rate: 10.90 },
        "TMT": { name: "🇹🇲 Turkmenistani Manat", symbol: "m", rate: 3.50 },
        "TND": { name: "🇹🇳 Tunisian Dinar", symbol: "د.ت", rate: 3.12 },
        "TOP": { name: "🇹🇴 Tongan Paʻanga", symbol: "T$", rate: 2.35 },
        "TRY": { name: "🇹🇷 Turkish Lira", symbol: "₺", rate: 32.20 },
        "TTD": { name: "🇹🇹 Trinidad and Tobago Dollar", symbol: "TT$", rate: 6.78 },
        "TVD": { name: "🇹🇼 Tuvaluan Dollar", symbol: "$", rate: 1.50 },
        "TWD": { name: "🇹🇼 New Taiwan Dollar", symbol: "NT$", rate: 32.30 },
        "TZS": { name: "🇹🇿 Tanzanian Shilling", symbol: "TSh", rate: 2580.00 },
        "UAH": { name: "🇺🇦 Ukrainian Hryvnia", symbol: "₴", rate: 39.50 },
        "UGX": { name: "🇺🇬 Ugandan Shilling", symbol: "USh", rate: 3800.00 },
        "USD": { name: "🇺🇸 United States Dollar", symbol: "$", rate: 1.00 },
        "UYU": { name: "🇺🇾 Uruguayan Peso", symbol: "$U", rate: 38.50 },
        "UZS": { name: "🇺🇿 Uzbekistani So'm", symbol: "лв", rate: 12600.00 },
        "VES": { name: "🇻🇪 Venezuelan Bolívar", symbol: "Bs.S", rate: 36.40 },
        "VND": { name: "🇻🇳 Vietnamese Đồng", symbol: "₫", rate: 25400.00 },
        "VUV": { name: "🇻🇺 Vanuatu Vatu", symbol: "VT", rate: 119.00 },
        "WST": { name: "🇼🇸 Samoan Tālā", symbol: "WS$", rate: 2.75 },
        "XAF": { name: "🇨🇲 Central African CFA Franc", symbol: "FCFA", rate: 605.00 },
        "XCD": { name: "🇦🇬 East Caribbean Dollar", symbol: "$", rate: 2.70 },
        "XOF": { name: "🇸🇳 West African CFA Franc", symbol: "CFA", rate: 605.00 },
        "XPF": { name: "🇵🇫 CFP Franc", symbol: "₣", rate: 110.00 },
        "YER": { name: "🇾🇪 Yemeni Rial", symbol: "﷼", rate: 250.00 },
        "ZAR": { name: "🇿🇦 South African Rand", symbol: "R", rate: 18.20 },
        "ZMW": { name: "🇿🇲 Zambian Kwacha", symbol: "ZK", rate: 26.50 },
        "ZWL": { name: "🇿🇼 Zimbabwean Dollar", symbol: "$", rate: 322.00 }
    };

    const convertCurrencyBtn = document.getElementById('convertCurrencyBtn');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');

    if (convertCurrencyBtn && fromCurrency && toCurrency) {
        const sortedCodes = Object.keys(currencyData).sort();
        
        sortedCodes.forEach(code => {
            const data = currencyData[code];
            const optionText = `${data.name} - ${code}`;
            
            fromCurrency.appendChild(new Option(optionText, code));
            toCurrency.appendChild(new Option(optionText, code));
        });

        fromCurrency.value = "USD";
        toCurrency.value = "INR";

        convertCurrencyBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('amountInput').value);
            const currencyResult = document.getElementById('currencyResult');
            const from = fromCurrency.value;
            const to = toCurrency.value;

            if (isNaN(amount) || amount <= 0) {
                if(currencyResult) currencyResult.textContent = 'Invalid amount';
                return;
            }

            const fromRate = currencyData[from].rate;
            const toRate = currencyData[to].rate;
            
            const converted = (amount * (toRate / fromRate)).toFixed(2);
            const fromSym = currencyData[from].symbol;
            const toSym = currencyData[to].symbol;
            
            if(currencyResult) {
                currencyResult.innerHTML = `<span style="color:var(--text-muted); font-size: 1.2rem;">${fromSym}${amount}</span><br>=<br><span style="color:var(--accent); font-size: 2rem;">${toSym}${converted}</span>`;
            }
            
            saveToHistory('FX', `${fromSym}${amount} → ${to}`, `${toSym}${converted}`);
        });
    }

    document.addEventListener('keydown', function(event) {
        if (document.activeElement.tagName === 'INPUT') return;

        const key = event.key;
        let targetButton = null;

        if (/[0-9\.]/.test(key)) {
            targetButton = document.querySelector(`.key.number[data-val="${key}"]`);
        } else if (['+', '-', '*', '/', '%'].includes(key)) {
            targetButton = document.querySelector(`.key.operator[data-val="${key}"]`);
        } else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            targetButton = document.querySelector('.key.equals');
        } else if (key === 'Backspace') {
            targetButton = document.querySelector('.key.action[data-action="delete"]');
        } else if (key === 'Escape') {
            targetButton = document.querySelector('.key.action[data-action="clear"]');
        }

        if (targetButton) {
            targetButton.click();
            
            const originalBg = targetButton.style.backgroundColor || '';
            targetButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            
            setTimeout(() => {
                targetButton.style.backgroundColor = originalBg;
            }, 100);
        }
    });
});
