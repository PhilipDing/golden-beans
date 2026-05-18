let currentMode = 1;
let currentView = 'chart';
let currentTimeUnit = 'month';
let calculatorChart = null;
let calculationData = null;

function openCalculatorModal() {
    document.getElementById('calculatorModal').classList.add('active');
    document.getElementById('calculatorResultContainer').style.display = 'none';

    if (currentMode === 1) {
        const currentBalance = app ? app.balance : 0;
        document.getElementById('currentAmount').value = currentBalance.toFixed(2);
        document.getElementById('targetAmount').value = '';
        document.getElementById('targetAmount').focus();
    } else {
        document.getElementById('monthlyAmount').value = '';
        document.getElementById('monthlyAmount').focus();
    }
    preventBodyScroll(true);
}

function closeCalculatorModal() {
    document.getElementById('calculatorModal').classList.remove('active');
    if (calculatorChart) {
        calculatorChart.destroy();
        calculatorChart = null;
    }
    preventBodyScroll(false);
}

function switchCalculatorMode(mode) {
    currentMode = mode;

    document.getElementById('modeTab1').classList.remove('active');
    document.getElementById('modeTab2').classList.remove('active');
    document.getElementById(`modeTab${mode}`).classList.add('active');

    document.getElementById('mode1Inputs').style.display = mode === 1 ? 'block' : 'none';
    document.getElementById('mode2Inputs').style.display = mode === 2 ? 'block' : 'none';

    document.getElementById('calculatorResultContainer').style.display = 'none';

    if (mode === 1) {
        const currentBalance = app ? app.balance : 0;
        document.getElementById('currentAmount').value = currentBalance.toFixed(2);
        document.getElementById('targetAmount').focus();
    } else {
        document.getElementById('monthlyAmount').focus();
    }
}

function switchView(view) {
    currentView = view;

    document.getElementById('chartTab').classList.remove('active');
    document.getElementById('tableTab').classList.remove('active');
    document.getElementById(`${view}Tab`).classList.add('active');

    document.getElementById('chartContainer').style.display = view === 'chart' ? 'block' : 'none';
    document.getElementById('tableContainer').style.display = view === 'table' ? 'block' : 'none';

    if (calculationData) {
        updateDisplay();
    }
}

function switchTimeUnit(unit) {
    currentTimeUnit = unit;

    document.getElementById('monthTab').classList.remove('active');
    document.getElementById('yearTab').classList.remove('active');
    document.getElementById(`${unit}Tab`).classList.add('active');

    if (calculationData) {
        updateDisplay();
    }
}

function calculate() {
    if (currentMode === 1) {
        calculateTargetMode();
    } else {
        calculateDepositMode();
    }
}

function calculateTargetMode() {
    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
    const currentAmount = parseFloat(document.getElementById('currentAmount').value) || 0;
    const monthlyDeposit = parseFloat(document.getElementById('monthlyDeposit').value) || 30;
    const monthlyRatePercent = parseFloat(document.getElementById('monthlyRate1').value) || 0.5;
    const monthlyRate = monthlyRatePercent / 100;

    if (isNaN(targetAmount) || targetAmount <= 0) {
        showToast('⚠️ 请输入有效的目标金额！');
        return;
    }

    if (currentAmount >= targetAmount) {
        showToast('⚠️ 当前金额已达到或超过目标金额！');
        return;
    }

    const months = calculateMonthsToTarget(currentAmount, targetAmount, monthlyDeposit, monthlyRate);

    calculationData = generateTargetModeData(currentAmount, targetAmount, monthlyDeposit, monthlyRate, months);

    const totalDeposit = currentAmount + monthlyDeposit * months;
    const totalInterest = calculationData.monthlyData[months - 1].total - totalDeposit;

    const summary = `
        <div class="summary-item">
            <span class="summary-label">🎯 目标金额：</span>
            <span class="summary-value">${targetAmount.toFixed(2)} 元</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">⏱️ 需要时间：</span>
            <span class="summary-value">${Math.floor(months / 12)} 年 ${months % 12} 月</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">💰 总存入：</span>
            <span class="summary-value">${totalDeposit.toFixed(2)} 元</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">📈 总利息：</span>
            <span class="summary-value interest">${totalInterest.toFixed(2)} 元</span>
        </div>
    `;

    document.getElementById('resultSummary').innerHTML = summary;
    document.getElementById('calculatorResultContainer').style.display = 'block';

    updateDisplay();
    showToast('✅ 计算完成！');
}

function calculateMonthsToTarget(current, target, monthlyDeposit, monthlyRate) {
    let balance = current;
    let months = 0;
    const maxMonths = 1200;

    while (balance < target && months < maxMonths) {
        balance = balance * (1 + monthlyRate) + monthlyDeposit;
        months++;
    }

    return months;
}

function generateTargetModeData(currentAmount, targetAmount, monthlyDeposit, monthlyRate, months) {
    const monthlyData = [];
    let balance = currentAmount;
    let totalPrincipal = currentAmount;

    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        balance = balance + interest + monthlyDeposit;
        totalPrincipal += monthlyDeposit;

        monthlyData.push({
            month: i,
            principal: totalPrincipal,
            interest: balance - totalPrincipal,
            total: balance
        });
    }

    return {
        type: 'target',
        monthlyData: monthlyData,
        targetAmount: targetAmount
    };
}

function calculateDepositMode() {
    const monthlyAmount = parseFloat(document.getElementById('monthlyAmount').value);
    const monthlyRatePercent = parseFloat(document.getElementById('monthlyRate2').value) || 0.5;
    const monthlyRate = monthlyRatePercent / 100;
    const months = parseInt(document.getElementById('depositMonths').value) || 12;

    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
        showToast('⚠️ 请输入有效的每月存入金额！');
        return;
    }

    calculationData = generateDepositModeData(monthlyAmount, monthlyRate, months);

    const totalPrincipal = monthlyAmount * months;
    const totalInterest = calculationData.monthlyData[months - 1].total - totalPrincipal;

    const summary = `
        <div class="summary-item">
            <span class="summary-label">💰 每月存入：</span>
            <span class="summary-value">${monthlyAmount.toFixed(2)} 元</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">⏱️ 存入时间：</span>
            <span class="summary-value">${Math.floor(months / 12)} 年 ${months % 12} 月</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">💵 总本金：</span>
            <span class="summary-value">${totalPrincipal.toFixed(2)} 元</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">📈 总利息：</span>
            <span class="summary-value interest">${totalInterest.toFixed(2)} 元</span>
        </div>
        <div class="summary-item total">
            <span class="summary-label">💎 本息合计：</span>
            <span class="summary-value">${calculationData.monthlyData[months - 1].total.toFixed(2)} 元</span>
        </div>
    `;

    document.getElementById('resultSummary').innerHTML = summary;
    document.getElementById('calculatorResultContainer').style.display = 'block';

    updateDisplay();
    showToast('✅ 计算完成！');
}

function generateDepositModeData(monthlyAmount, monthlyRate, months) {
    const monthlyData = [];
    let balance = 0;
    let totalPrincipal = 0;

    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        balance = balance + interest + monthlyAmount;
        totalPrincipal += monthlyAmount;

        monthlyData.push({
            month: i,
            principal: totalPrincipal,
            interest: balance - totalPrincipal,
            total: balance
        });
    }

    return {
        type: 'deposit',
        monthlyData: monthlyData
    };
}

function updateDisplay() {
    if (!calculationData) return;

    const data = currentTimeUnit === 'month'
        ? calculationData.monthlyData
        : aggregateYearlyData(calculationData.monthlyData);

    if (currentView === 'chart') {
        renderChart(data);
    } else {
        renderTable(data);
    }
}

function aggregateYearlyData(monthlyData) {
    const yearlyData = [];
    const totalMonths = monthlyData.length;

    for (let year = 1; year <= Math.ceil(totalMonths / 12); year++) {
        const startMonth = (year - 1) * 12;
        const endMonth = Math.min(year * 12, totalMonths);

        const lastMonthData = monthlyData[endMonth - 1];

        yearlyData.push({
            month: year,
            year: year,
            principal: lastMonthData.principal,
            interest: lastMonthData.interest,
            total: lastMonthData.total
        });
    }

    return yearlyData;
}

function renderChart(data) {
    const ctx = document.getElementById('calculatorChart').getContext('2d');

    if (calculatorChart) {
        calculatorChart.destroy();
    }

    const labels = data.map(d => currentTimeUnit === 'month'
        ? `第${d.month}月`
        : `第${d.year}年`);

    calculatorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '本金',
                    data: data.map(d => d.principal),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '利息',
                    data: data.map(d => d.interest),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '总计',
                    data: data.map(d => d.total),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} 元`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(2) + ' 元';
                        }
                    }
                }
            }
        }
    });
}

function renderTable(data) {
    const header = document.getElementById('tableHeader');
    const body = document.getElementById('tableBody');

    if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">暂无数据</td></tr>';
        return;
    }

    const timeLabel = currentTimeUnit === 'month' ? '月份' : '年份';

    header.innerHTML = `
        <th>${timeLabel}</th>
        <th>本金（元）</th>
        <th>利息（元）</th>
        <th>总计（元）</th>
    `;

    body.innerHTML = data.map(d => {
        const timeValue = currentTimeUnit === 'month' ? `第${d.month}月` : `第${d.year}年`;
        return `
            <tr>
                <td>${timeValue}</td>
                <td>${d.principal.toFixed(2)}</td>
                <td class="interest-cell">${d.interest.toFixed(2)}</td>
                <td class="total-cell">${d.total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCalculatorModal();
    }
});
