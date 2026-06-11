document.addEventListener('DOMContentLoaded', () => {

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') document.body.setAttribute('data-theme', 'dark');

        themeToggle.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
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

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            toolSections.forEach(s => s.classList.remove('active-tool'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) targetSection.classList.add('active-tool');
            if (currentToolTitle) currentToolTitle.textContent = btn.textContent;
            
            closeMenu();
        });
    });

    const toolSearch = document.getElementById('toolSearch');
    if (toolSearch) {
        toolSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            navButtons.forEach(btn => {
                const text = btn.textContent.toLowerCase();
                btn.style.display = text.includes(term) ? 'block' : 'none';
            });
        });
    }

    const globalHistoryList = document.getElementById('globalHistoryList');
    
    function renderHistory() {
        if (!globalHistoryList) return;
        const history = JSON.parse(localStorage.getItem('calcHistory')) || [];
        globalHistoryList.innerHTML = '';
        history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span style="opacity:0.5; margin-right:8px;">${item.toolName}</span> ${item.operation} = <strong>${item.result}</strong>`;
            globalHistoryList.appendChild(li);
        });
    }

    function saveToHistory(toolName, operation, result) {
        let history = JSON.parse(localStorage.getItem('calcHistory')) || [];
        history.unshift({ toolName, operation, result, timestamp: new Date().toISOString() });
        if (history.length > 8) history.pop();
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
    const keys = document.querySelectorAll('.key');

    if (calcDisplay && keys.length > 0) {
        let currentOperand = '0';
        let previousOperand = '';
        let currentOperation = null;
        let shouldResetDisplay = false;

        function updateDisplay() {
            calcDisplay.textContent = currentOperand;
            if (calcHistory) {
                calcHistory.textContent = currentOperation ? `${previousOperand} ${currentOperation}` : '';
            }
        }

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

            saveToHistory('Calc', `${prev} ${currentOperation} ${current}`, computation);
            currentOperand = computation.toString();
            currentOperation = null;
            previousOperand = '';
            shouldResetDisplay = true;
        }

        keys.forEach(button => {
            button.addEventListener('click', () => {
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
                if (button.getAttribute('data-action') === 'calculate') {
                    compute();
                    updateDisplay();
                }
                if (button.getAttribute('data-action') === 'clear') {
                    currentOperand = '0';
                    previousOperand = '';
                    currentOperation = null;
                    updateDisplay();
                }
                if (button.getAttribute('data-action') === 'delete') {
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
            const gender = document.getElementById('genderSelect').value;
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
            } else if (bmi >= 18.5 && bmi <= 24.9) {
                category = 'Normal';
                colorClass = 'bmi-normal';
            } else if (bmi >= 25 && bmi <= 29.9) {
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

    const currencyData = {
        "AED": { name: "🇦🇪 UAE Dirham", symbol: "د.إ" },
        "AFN": { name: "🇦🇫 Afghan Afghani", symbol: "؋" },
        "ALL": { name: "🇦🇱 Albanian Lek", symbol: "L" },
        "AMD": { name: "🇦🇲 Armenian Dram", symbol: "֏" },
        "ANG": { name: "🇨🇼 Neth. Antillean Guilder", symbol: "ƒ" },
        "AOA": { name: "🇦🇴 Angolan Kwanza", symbol: "Kz" },
        "ARS": { name: "🇦🇷 Argentine Peso", symbol: "$" },
        "AUD": { name: "🇦🇺 Australian Dollar", symbol: "A$" },
        "AWG": { name: "🇦🇼 Aruban Florin", symbol: "ƒ" },
        "AZN": { name: "🇦🇿 Azerbaijani Manat", symbol: "₼" },
        "BAM": { name: "🇧🇦 Bosnia-Herz. Mark", symbol: "KM" },
        "BBD": { name: "🇧🇧 Barbadian Dollar", symbol: "$" },
        "BDT": { name: "🇧🇩 Bangladeshi Taka", symbol: "৳" },
        "BGN": { name: "🇧🇬 Bulgarian Lev", symbol: "лв" },
        "BHD": { name: "🇧🇭 Bahraini Dinar", symbol: ".د.ب" },
        "BIF": { name: "🇧🇮 Burundian Franc", symbol: "FBu" },
        "BMD": { name: "🇧🇲 Bermudian Dollar", symbol: "$" },
        "BND": { name: "🇧🇳 Brunei Dollar", symbol: "$" },
        "BOB": { name: "🇧🇴 Bolivian Boliviano", symbol: "Bs." },
        "BRL": { name: "🇧🇷 Brazilian Real", symbol: "R$" },
        "BSD": { name: "🇧🇸 Bahamian Dollar", symbol: "$" },
        "BTN": { name: "🇧🇹 Bhutanese Ngultrum", symbol: "Nu." },
        "BWP": { name: "🇧🇼 Botswana Pula", symbol: "P" },
        "BYN": { name: "🇧🇾 Belarusian Ruble", symbol: "Br" },
        "BZD": { name: "🇧🇿 Belize Dollar", symbol: "BZ$" },
        "CAD": { name: "🇨🇦 Canadian Dollar", symbol: "C$" },
        "CDF": { name: "🇨🇩 Congolese Franc", symbol: "FC" },
        "CHF": { name: "🇨🇭 Swiss Franc", symbol: "CHF" },
        "CLP": { name: "🇨🇱 Chilean Peso", symbol: "$" },
        "CNY": { name: "🇨🇳 Chinese Yuan", symbol: "¥" },
        "COP": { name: "🇨🇴 Colombian Peso", symbol: "$" },
        "CRC": { name: "🇨🇷 Costa Rican Colón", symbol: "₡" },
        "CUP": { name: "🇨🇺 Cuban Peso", symbol: "$" },
        "CVE": { name: "🇨🇻 Cape Verdean Escudo", symbol: "$" },
        "CZK": { name: "🇨🇿 Czech Koruna", symbol: "Kč" },
        "DJF": { name: "🇩🇯 Djiboutian Franc", symbol: "Fdj" },
        "DKK": { name: "🇩🇰 Danish Krone", symbol: "kr" },
        "DOP": { name: "🇩🇴 Dominican Peso", symbol: "RD$" },
        "DZD": { name: "🇩🇿 Algerian Dinar", symbol: "د.ج" },
        "EGP": { name: "🇪🇬 Egyptian Pound", symbol: "£" },
        "ERN": { name: "🇪🇷 Eritrean Nakfa", symbol: "Nfk" },
        "ETB": { name: "🇪🇹 Ethiopian Birr", symbol: "Br" },
        "EUR": { name: "🇪🇺 Euro", symbol: "€" },
        "FJD": { name: "🇫🇯 Fijian Dollar", symbol: "FJ$" },
        "FKP": { name: "🇫🇰 Falkland Islands Pound", symbol: "£" },
        "FOK": { name: "🇫🇴 Faroese Króna", symbol: "kr" },
        "GBP": { name: "🇬🇧 British Pound", symbol: "£" },
        "GEL": { name: "🇬🇪 Georgian Lari", symbol: "₾" },
        "GGP": { name: "🇬🇬 Guernsey Pound", symbol: "£" },
        "GHS": { name: "🇬🇭 Ghanaian Cedi", symbol: "GH₵" },
        "GIP": { name: "🇬🇮 Gibraltar Pound", symbol: "£" },
        "GMD": { name: "🇬🇲 Gambian Dalasi", symbol: "D" },
        "GNF": { name: "🇬🇳 Guinean Franc", symbol: "FG" },
        "GTQ": { name: "🇬🇹 Guatemalan Quetzal", symbol: "Q" },
        "GYD": { name: "🇬🇾 Guyanese Dollar", symbol: "$" },
        "HKD": { name: "🇭🇰 Hong Kong Dollar", symbol: "HK$" },
        "HNL": { name: "🇭🇳 Honduran Lempira", symbol: "L" },
        "HTG": { name: "🇭🇹 Haitian Gourde", symbol: "G" },
        "HUF": { name: "🇭🇺 Hungarian Forint", symbol: "Ft" },
        "IDR": { name: "🇮🇩 Indonesian Rupiah", symbol: "Rp" },
        "ILS": { name: "🇮🇱 Israeli New Shekel", symbol: "₪" },
        "IMP": { name: "🇮🇲 Manx Pound", symbol: "£" },
        "INR": { name: "🇮🇳 Indian Rupee", symbol: "₹" },
        "IQD": { name: "🇮🇶 Iraqi Dinar", symbol: "ع.د" },
        "IRR": { name: "🇮🇷 Iranian Rial", symbol: "﷼" },
        "ISK": { name: "🇮🇸 Icelandic Króna", symbol: "kr" },
        "JEP": { name: "🇯🇪 Jersey Pound", symbol: "£" },
        "JMD": { name: "🇯🇲 Jamaican Dollar", symbol: "J$" },
        "JOD": { name: "🇯🇴 Jordanian Dinar", symbol: "د.ا" },
        "JPY": { name: "🇯🇵 Japanese Yen", symbol: "¥" },
        "KES": { name: "🇰🇪 Kenyan Shilling", symbol: "KSh" },
        "KGS": { name: "🇰🇬 Kyrgyzstani Som", symbol: "лв" },
        "KHR": { name: "🇰🇭 Cambodian Riel", symbol: "៛" },
        "KID": { name: "🇰🇮 Kiribati Dollar", symbol: "$" },
        "KMF": { name: "🇰🇲 Comorian Franc", symbol: "CF" },
        "KRW": { name: "🇰🇷 South Korean Won", symbol: "₩" },
        "KWD": { name: "🇰🇼 Kuwaiti Dinar", symbol: "د.ك" },
        "KYD": { name: "🇰🇾 Cayman Islands Dollar", symbol: "$" },
        "KZT": { name: "🇰🇿 Kazakhstani Tenge", symbol: "₸" },
        "LAK": { name: "🇱🇦 Lao Kip", symbol: "₭" },
        "LBP": { name: "🇱🇧 Lebanese Pound", symbol: "£" },
        "LKR": { name: "🇱🇰 Sri Lankan Rupee", symbol: "Rs" },
        "LRD": { name: "🇱🇷 Liberian Dollar", symbol: "$" },
        "LSL": { name: "🇱🇸 Lesotho Loti", symbol: "L" },
        "LYD": { name: "🇱🇾 Libyan Dinar", symbol: "ل.د" },
        "MAD": { name: "🇲🇦 Moroccan Dirham", symbol: "د.م." },
        "MDL": { name: "🇲🇩 Moldovan Leu", symbol: "L" },
        "MGA": { name: "🇲🇬 Malagasy Ariary", symbol: "Ar" },
        "MKD": { name: "🇲🇰 Macedonian Denar", symbol: "ден" },
        "MMK": { name: "🇲🇲 Myanmar Kyat", symbol: "K" },
        "MNT": { name: "🇲🇳 Mongolian Tögrög", symbol: "₮" },
        "MOP": { name: "🇲🇴 Macanese Pataca", symbol: "P" },
        "MRU": { name: "🇲🇷 Mauritanian Ouguiya", symbol: "UM" },
        "MUR": { name: "🇲🇺 Mauritian Rupee", symbol: "₨" },
        "MVR": { name: "🇲🇻 Maldivian Rufiyaa", symbol: "Rf" },
        "MWK": { name: "🇲🇼 Malawian Kwacha", symbol: "MK" },
        "MXN": { name: "🇲🇽 Mexican Peso", symbol: "$" },
        "MYR": { name: "🇲🇾 Malaysian Ringgit", symbol: "RM" },
        "MZN": { name: "🇲🇿 Mozambican Metical", symbol: "MT" },
        "NAD": { name: "🇳🇦 Namibian Dollar", symbol: "$" },
        "NGN": { name: "🇳🇬 Nigerian Naira", symbol: "₦" },
        "NIO": { name: "🇳🇮 Nicaraguan Córdoba", symbol: "C$" },
        "NOK": { name: "🇳🇴 Norwegian Krone", symbol: "kr" },
        "NPR": { name: "🇳🇵 Nepalese Rupee", symbol: "रू" },
        "NZD": { name: "🇳🇿 New Zealand Dollar", symbol: "NZ$" },
        "OMR": { name: "🇴🇲 Omani Rial", symbol: "ر.ع." },
        "PAB": { name: "🇵🇦 Panamanian Balboa", symbol: "B/." },
        "PEN": { name: "🇵🇪 Peruvian Sol", symbol: "S/" },
        "PGK": { name: "🇵🇬 Papua New Guinean Kina", symbol: "K" },
        "PHP": { name: "🇵🇭 Philippine Peso", symbol: "₱" },
        "PKR": { name: "🇵🇰 Pakistani Rupee", symbol: "₨" },
        "PLN": { name: "🇵🇱 Polish Złoty", symbol: "zł" },
        "PYG": { name: "🇵🇾 Paraguayan Guaraní", symbol: "₲" },
        "QAR": { name: "🇶🇦 Qatari Riyal", symbol: "ر.ق" },
        "RON": { name: "🇷🇴 Romanian Leu", symbol: "lei" },
        "RSD": { name: "🇷🇸 Serbian Dinar", symbol: "дин" },
        "RUB": { name: "🇷🇺 Russian Ruble", symbol: "₽" },
        "RWF": { name: "🇷🇼 Rwandan Franc", symbol: "FRw" },
        "SAR": { name: "🇸🇦 Saudi Riyal", symbol: "﷼" },
        "SBD": { name: "🇸🇧 Solomon Islands Dollar", symbol: "$" },
        "SCR": { name: "🇸🇨 Seychellois Rupee", symbol: "₨" },
        "SDG": { name: "🇸🇩 Sudanese Pound", symbol: "ج.س." },
        "SEK": { name: "🇸🇪 Swedish Krona", symbol: "kr" },
        "SGD": { name: "🇸🇬 Singapore Dollar", symbol: "S$" },
        "SHP": { name: "🇸🇭 Saint Helena Pound", symbol: "£" },
        "SLE": { name: "🇸🇱 Sierra Leonean Leone", symbol: "Le" },
        "SOS": { name: "🇸🇴 Somali Shilling", symbol: "Sh" },
        "SRD": { name: "🇸🇷 Surinamese Dollar", symbol: "$" },
        "SSP": { name: "🇸🇸 South Sudanese Pound", symbol: "£" },
        "STN": { name: "🇸🇹 São Tomé Príncipe Dobra", symbol: "Db" },
        "SYP": { name: "🇸🇾 Syrian Pound", symbol: "£" },
        "SZL": { name: "🇸🇿 Swazi Lilangeni", symbol: "L" },
        "THB": { name: "🇹🇭 Thai Baht", symbol: "฿" },
        "TJS": { name: "🇹🇯 Tajikistani Somoni", symbol: "ЅМ" },
        "TMT": { name: "🇹🇲 Turkmenistani Manat", symbol: "m" },
        "TND": { name: "🇹🇳 Tunisian Dinar", symbol: "د.ت" },
        "TOP": { name: "🇹🇴 Tongan Paʻanga", symbol: "T$" },
        "TRY": { name: "🇹🇷 Turkish Lira", symbol: "₺" },
        "TTD": { name: "🇹🇹 Trinidad and Tobago Dollar", symbol: "TT$" },
        "TVD": { name: "🇹🇻 Tuvaluan Dollar", symbol: "$" },
        "TWD": { name: "🇹🇼 New Taiwan Dollar", symbol: "NT$" },
        "TZS": { name: "🇹🇿 Tanzanian Shilling", symbol: "TSh" },
        "UAH": { name: "🇺🇦 Ukrainian Hryvnia", symbol: "₴" },
        "UGX": { name: "🇺🇬 Ugandan Shilling", symbol: "USh" },
        "USD": { name: "🇺🇸 United States Dollar", symbol: "$" },
        "UYU": { name: "🇺🇾 Uruguayan Peso", symbol: "$U" },
        "UZS": { name: "🇺🇿 Uzbekistani So'm", symbol: "лв" },
        "VES": { name: "🇻🇪 Venezuelan Bolívar", symbol: "Bs.S" },
        "VND": { name: "🇻🇳 Vietnamese Đồng", symbol: "₫" },
        "VUV": { name: "🇻🇺 Vanuatu Vatu", symbol: "VT" },
        "WST": { name: "🇼🇸 Samoan Tālā", symbol: "WS$" },
        "XAF": { name: "🇨🇲 Central African CFA Franc", symbol: "FCFA" },
        "XCD": { name: "🇦🇬 East Caribbean Dollar", symbol: "$" },
        "XOF": { name: "🇸🇳 West African CFA Franc", symbol: "CFA" },
        "XPF": { name: "🇵🇫 CFP Franc", symbol: "₣" },
        "YER": { name: "🇾🇪 Yemeni Rial", symbol: "﷼" },
        "ZAR": { name: "🇿🇦 South African Rand", symbol: "R" },
        "ZMW": { name: "🇿🇲 Zambian Kwacha", symbol: "ZK" },
        "ZWL": { name: "🇿🇼 Zimbabwean Dollar", symbol: "$" }
    };

    const convertCurrencyBtn = document.getElementById('convertCurrencyBtn');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');

    if (convertCurrencyBtn && fromCurrency && toCurrency) {
        Object.keys(currencyData).forEach(code => {
            const data = currencyData[code];
            const optionText = `${data.name} - ${code}`;
            
            fromCurrency.appendChild(new Option(optionText, code));
            toCurrency.appendChild(new Option(optionText, code));
        });

        fromCurrency.value = "EUR";
        toCurrency.value = "INR";

        convertCurrencyBtn.addEventListener('click', a
