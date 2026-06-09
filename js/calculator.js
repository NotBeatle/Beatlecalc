const calcDisplay = document.getElementById('calcDisplay');
const calcHistory = document.getElementById('calcHistory');
const keys = document.querySelectorAll('.key');

let currentOperand = '0';
let previousOperand = '';
let currentOperation = null;
let shouldResetDisplay = false;

function updateDisplay() {
    calcDisplay.textContent = currentOperand;
    if (currentOperation != null) {
        calcHistory.textContent = `${previousOperand} ${currentOperation}`;
    } else {
        calcHistory.textContent = '';
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

function chooseOperation(operation) {
    if (currentOperand === '') return;
    if (previousOperand !== '') {
        compute();
    }
    currentOperation = operation;
    previousOperand = currentOperand;
    shouldResetDisplay = true;
}

function compute() {
    let computation;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return;

    switch (currentOperation) {
        case '+':
            computation = prev + current;
            break;
        case '-':
            computation = prev - current;
            break;
        case '*':
            computation = prev * current;
            break;
        case '/':
            if (current === 0) {
                currentOperand = 'Error';
                previousOperand = '';
                currentOperation = null;
                return;
            }
            computation = prev / current;
            break;
        case '%':
            computation = prev % current;
            break;
        default:
            return;
    }

    window.saveToGlobalHistory('Standard', `${prev} ${currentOperation} ${current}`, computation);
    currentOperand = computation.toString();
    currentOperation = null;
    previousOperand = '';
    shouldResetDisplay = true;
}

function clear() {
    currentOperand = '0';
    previousOperand = '';
    currentOperation = null;
}

function deleteNumber() {
    if (currentOperand === 'Error' || shouldResetDisplay) return;
    currentOperand = currentOperand.toString().slice(0, -1);
    if (currentOperand === '') currentOperand = '0';
}

keys.forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('number')) {
            appendNumber(button.getAttribute('data-val'));
            updateDisplay();
        }
        if (button.classList.contains('operator')) {
            chooseOperation(button.getAttribute('data-val'));
            updateDisplay();
        }
        if (button.getAttribute('data-action') === 'calculate') {
            compute();
            updateDisplay();
        }
        if (button.getAttribute('data-action') === 'clear') {
            clear();
            updateDisplay();
        }
        if (button.getAttribute('data-action') === 'delete') {
            deleteNumber();
            updateDisplay();
        }
    });
});

document.addEventListener('keydown', (e) => {
    const toolSection = document.getElementById('standard');
    if (!toolSection.classList.contains('active-tool')) return;

    if (e.key >= 0 && e.key <= 9 || e.key === '.') {
        appendNumber(e.key);
        updateDisplay();
    }
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '%') {
        chooseOperation(e.key);
        updateDisplay();
    }
    if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        compute();
        updateDisplay();
    }
    if (e.key === 'Backspace') {
        deleteNumber();
        updateDisplay();
    }
    if (e.key === 'Escape') {
        clear();
        updateDisplay();
    }
});

const calcBmiBtn = document.getElementById('calcBmiBtn');
const heightInput = document.getElementById('heightInput');
const weightInput = document.getElementById('weightInput');
const bmiResult = document.getElementById('bmiResult');

calcBmiBtn.addEventListener('click', () => {
    const height = parseFloat(heightInput.value) / 100;
    const weight = parseFloat(weightInput.value);

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        bmiResult.textContent = 'Please enter valid numbers.';
        return;
    }

    const bmi = (weight / (height * height)).toFixed(1);
    let category = '';

    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 24.9) category = 'Normal weight';
    else if (bmi < 29.9) category = 'Overweight';
    else category = 'Obese';

    const resultText = `BMI: ${bmi} (${category})`;
    bmiResult.textContent = resultText;
    window.saveToGlobalHistory('BMI', `H:${heightInput.value}cm W:${weight}kg`, bmi);
});

const currencyData = {
    "EUR": { name: "🇪🇺 Eurozone", symbol: "€" },
    "INR": { name: "🇮🇳 India", symbol: "₹" },
    "USD": { name: "🇺🇸 United States", symbol: "$" },
    "GBP": { name: "🇬🇧 United Kingdom", symbol: "£" },
    "JPY": { name: "🇯🇵 Japan", symbol: "¥" },
    "AUD": { name: "🇦🇺 Australia", symbol: "A$" },
    "CAD": { name: "🇨🇦 Canada", symbol: "C$" },
    "CHF": { name: "🇨🇭 Switzerland", symbol: "CHF" },
    "CNY": { name: "🇨🇳 China", symbol: "¥" },
    "AED": { name: "🇦🇪 UAE", symbol: "د.إ" },
    "SGD": { name: "🇸🇬 Singapore", symbol: "S$" },
    "NZD": { name: "🇳🇿 New Zealand", symbol: "NZ$" },
    "ZAR": { name: "🇿🇦 South Africa", symbol: "R" },
    "BRL": { name: "🇧🇷 Brazil", symbol: "R$" },
    "RUB": { name: "🇷🇺 Russia", symbol: "₽" },
    "KRW": { name: "🇰🇷 South Korea", symbol: "₩" },
    "SEK": { name: "🇸🇪 Sweden", symbol: "kr" },
    "NOK": { name: "🇳🇴 Norway", symbol: "kr" },
    "MXN": { name: "🇲🇽 Mexico", symbol: "$" },
    "TRY": { name: "🇹🇷 Turkey", symbol: "₺" },
    "SAR": { name: "🇸🇦 Saudi Arabia", symbol: "﷼" },
    "HKD": { name: "🇭🇰 Hong Kong", symbol: "HK$" },
    "IDR": { name: "🇮🇩 Indonesia", symbol: "Rp" },
    "MYR": { name: "🇲🇾 Malaysia", symbol: "RM" },
    "PHP": { name: "🇵🇭 Philippines", symbol: "₱" },
    "THB": { name: "🇹🇭 Thailand", symbol: "฿" },
    "VND": { name: "🇻🇳 Vietnam", symbol: "₫" },
    "EGP": { name: "🇪🇬 Egypt", symbol: "E£" },
    "ARS": { name: "🇦🇷 Argentina", symbol: "$" },
    "CLP": { name: "🇨🇱 Chile", symbol: "$" },
    "COP": { name: "🇨🇴 Colombia", symbol: "$" },
    "PEN": { name: "🇵🇪 Peru", symbol: "S/" }
};

const convertCurrencyBtn = document.getElementById('convertCurrencyBtn');
const amountInput = document.getElementById('amountInput');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const currencyResult = document.getElementById('currencyResult');

Object.keys(currencyData).forEach(code => {
    const data = currencyData[code];
    const optionText = `${data.name} - ${code} (${data.symbol})`;
    
    const opt1 = document.createElement('option');
    opt1.value = code;
    opt1.textContent = optionText;
    fromCurrency.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = code;
    opt2.textContent = optionText;
    toCurrency.appendChild(opt2);
});

fromCurrency.value = "EUR";
toCurrency.value = "INR";

convertCurrencyBtn.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) {
        currencyResult.textContent = 'Enter valid amount';
        return;
    }

    currencyResult.textContent = 'Converting...';

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await response.json();
        
        if (!data.rates[to]) {
            currencyResult.textContent = 'Currency not supported by API';
            return;
        }

        const rate = data.rates[to];
        const converted = (amount * rate).toFixed(2);
        
        const fromSym = currencyData[from].symbol;
        const toSym = currencyData[to].symbol;
        
        currencyResult.textContent = `${fromSym}${amount} = ${toSym}${converted}`;
        window.saveToGlobalHistory('Currency', `${fromSym}${amount} to ${to}`, `${toSym}${converted}`);
    } catch (error) {
        currencyResult.textContent = 'API Error. Try again.';
    }
});
