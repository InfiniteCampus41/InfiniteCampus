window.addEventListener('DOMContentLoaded', () => {
    const colorInput        = document.getElementById('colorInput');
    const themeSelector     = document.getElementById('themeSelector');
    const resetBtn          = document.getElementById('resetColors');
    const header            = document.getElementById('site-header');
    const mobile            = document.getElementById('mobileSidePanel');
    const footer            = document.getElementById('site-footer');
    const textOnlyFooter    = document.getElementById('text-only-footer');
    const globalText        = document.getElementById('global-text');
    const gradLeftInput     = document.getElementById('gradientLeft');
    const gradRightInput    = document.getElementById('gradientRight');
    const testElements      = document.querySelectorAll('.test');
    const isDarkColor = hex => {
        if (!hex || hex.length !== 7 || !hex.startsWith('#')) return false;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    };
    function applyTheme(colOrLeft, gradientSetting = null) {
            document.querySelectorAll('.rgb-element').forEach(div => {
            div.style.animation = 'none !important';
        });
        let bg = colOrLeft;
        let isDark = isDarkColor(colOrLeft);
        if (gradientSetting === 'custom') {
            const l = localStorage.getItem('gradientLeft')  || '#ffffff';
            const r = localStorage.getItem('gradientRight') || '#000000';
            bg = `linear-gradient(to right, ${l}, ${r})`;
            isDark = isDarkColor(l) || isDarkColor(r);
        } else if (gradientSetting) {
            if (gradientSetting === 'red') {
                bg = 'linear-gradient(to right, darkred, black)';
                isDark = true;
            } else if (gradientSetting === 'green') {
                bg = 'linear-gradient(to right, #8cbe37, black)';
                isDark = true;
            } else if (gradientSetting === 'sunset') {
                bg = 'linear-gradient(to right, yellow, brown)';
                isDark = false;
            } else if (gradientSetting === 'reversered') {
                bg = 'linear-gradient(to right, black, darkred)';
                isDark = true;
            } else if (gradientSetting === 'reversegreen') {
                bg = 'linear-gradient(to right, black, #8cbe37)';
                isDark = true;
            } else if (gradientSetting === 'reversesunset') {
                bg = 'linear-gradient(to right, brown, yellow)';
                isDark = false;
            } else if (gradientSetting === 'bty') {
                bg = 'linear-gradient(to right, #37A7BE, #8cbe37, yellow)';
                isDark = false;
            } else if (gradientSetting === 'btg') {
                bg = 'linear-gradient(to right, black, gold)';
                isDark = true;
            } else if (gradientSetting === 'lights') {
                bg = 'linear-gradient(234deg, black,darkgrey,grey,brown,maroon,salmon,darkred,red,black,black,black,black,black,black,black,black,black,black,black,black,black,blue,orange,blue,black,black,black,black,black,black,black,black,black,black,darkgreen,green,lime,#7FFF00,yellow,#FFAE42,orange,#FFAE42,yellow,#7FFF00,lime,green,darkgreen,black,black, gold,brown,gold,black,black,black,black,black,black,black)';
                isDark = true;
            } else if (gradientSetting === 'bld') {
                bg = 'linear-gradient(to bottom, black,grey,white,black,black,black,black,black,black,black,black,black,white, grey,black)';
                isDark = true;
            } else if (gradientSetting === 'gsaber') {
                bg = 'linear-gradient(to bottom, transparent, #004000, #008000, #00BF00, #00FF00,#80FF00,#C0FF00,#E0FF00,white,white,white,white,white,white,white,white,white,white,white,white,white,white,white,#E0FF00,#C0FF00,#80FF00,#00FF00,#008F00,#008000,#004000,transparent)';
                isDark = false;
            } else if (gradientSetting === 'rsaber') {
                bg = 'linear-gradient(to bottom,transparent,#330000,#660000,#990000,#CC0000,red,red,#FF3333,white,white,white,white,white,white,white,white,white,white,white,white,white,white,#FF3333,red,red,#CC0000,#990000,#660000,#330000,transparent)';
                isDark = false;
            } else if (gradientSetting === 'bsaber') {
                bg = 'linear-gradient(to bottom, transparent,#011926,#011926,#003E5C,#003E5C,#003A6B,#5880A2,#83A3BE,#AFC6D9,#DBE9F5,white,white,white,white,white,white,white,white,white,white,white,white,white,white,white,#DBE9F5,#AFC6D9,#83A3BE,#5880A2,#003A6B,#003E5C,#003E5C,#011926,#011926,transparent)';
                isDark = false;
            } else if (gradientSetting === 'psaber') {
                bg = 'linear-gradient(to bottom, transparent,#1B1B1B,#2A1E36,#3A2152,#49236D,#582688,purple,#D8BFD8,#D4C0D9,#F0F0FF,white,white,white,white,white,white,white,white,white,white,white,white,white,white,white,#F0F0FF,#D4C0D9,#D8BFD8,purple,#582688,#49236D,#3A2152,#2A1E36,#1B1B1B,transparent)';
                isDark = false;
            } else if (gradientSetting === 'trans') {
                bg = 'linear-gradient(to bottom,black,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,transparent,black)';
                isDark = true;
                document.querySelectorAll('.darkbuttons').forEach(a => {
                    a.style.filter = 'none';
                });
            } else if (gradientSetting === 'drk') {
                bg = 'linear-gradient(to right, black, black)';
                isDark = true;
            } else if (gradientSetting === 'lit') {
                bg = 'linear-gradient(to right, rgb(214,214,214), rgb(214,214,214))';
                isDark= false;
            } else if (gradientSetting === 'mnb') {
                bg = 'linear-gradient(to right, darkblue, black)';
                isDark = true;
            } else if (gradientSetting === 'cms') {
                bg = 'linear-gradient(to right, green, red)';
                isDark = true;
            } else if (gradientSetting === 'wtr') {
                bg = 'linear-gradient(to right, #374377, #bec7ad)';
                isDark = true;
            } else if (gradientSetting === 'lve') {
                bg = 'linear-gradient(to right, #be5f37, #be3786)';
                isDark = true;
            } else if (gradientSetting === 'tky') {
                bg = 'linear-gradient(to right, #be9a37, #be5f37)';
                isDark = true;
            } else if (gradientSetting === 'rgb') {
                bg = 'transparent';
                isDark = true;
                document.querySelectorAll('.rgb-element').forEach(div => {
                    div.style.animation = 'rgbAnimation 30s infinite linear';
                });
            }
        }
        const textColor = isDark ? 'white' : '';
        localStorage.setItem('globalDarkTheme', isDark);
        localStorage.setItem('globalTextColor', textColor);
        [header, footer, mobile].forEach(bar => {
            if (!bar) return;
            bar.style.background = bg;
            bar.style.color = textColor;
            bar.style.borderColor = 'white';
            bar.querySelectorAll('a, span, div, p').forEach(e => {
                e.style.color = textColor || '';
                e.style.borderColor = textColor || '';
            });
            bar.querySelectorAll('img').forEach(img => {
                img.style.filter = isDark ? 'invert(1)' : '';
            });
            if (!isDark && bar === header) {
                bar.querySelectorAll('button').forEach(btn => {
                    btn.style.backgroundColor = '';
                    btn.style.color = 'black';
                    btn.style.border = '';
                });
                bar.querySelectorAll('a').forEach(a => {
                    a.style.color = 'black';
                })
            }
            if (!isDark && bar === footer) {
                bar.querySelectorAll('p, span, div').forEach(el => {
                    el.style.color = '';
                });
            }
            document.querySelectorAll('.settings').forEach(img => {
                img.style.filter = isDark ? 'invert(0)' : 'invert(1)';
            });
            document.querySelectorAll('.settings-button').forEach(div => {
                div.style.border = isDark ? '1px solid white' : '1px solid black';
            });
            document.querySelectorAll('.darkbuttons').forEach(a => {
                a.style.border = isDark ? '1px solid white' : '1px solid black';
                a.style.color = isDark ? 'white' : 'black';
            });
        });
        if (header && testElements.length > 0) {
            const headerBg = window.getComputedStyle(header).background;
            testElements.forEach(el => el.style.background = headerBg);
        }
        textOnlyFooter && (textOnlyFooter.style.color = textColor || '');
        globalText && (globalText.style.color = textColor || '');
        if (colorInput) {
            colorInput.style.backgroundColor = colOrLeft;
            colorInput.style.color = textColor;
            if (parseFloat(getComputedStyle(colorInput).borderWidth) > 0)
                colorInput.style.borderColor = textColor;
        }
    }
    const storedTheme = localStorage.getItem('useGradient');
    const storedFlat  = localStorage.getItem('headerColor');
    const storedLeft  = localStorage.getItem('gradientLeft');
    const storedRight = localStorage.getItem('gradientRight');
    if (storedTheme && storedTheme !== 'custom') {
        if (themeSelector) themeSelector.value = storedTheme;
        applyTheme('#000000', storedTheme);
    } else if (storedTheme === 'custom' && storedLeft && storedRight) {
        if (gradLeftInput) gradLeftInput.value = storedLeft;
        if (gradRightInput) gradRightInput.value = storedRight;
        applyTheme(storedLeft, 'custom');
    } else if (storedFlat) {
        if (colorInput) colorInput.value = storedFlat;
        applyTheme(storedFlat);
    } else {
        const monthIndex = new Date().getMonth();
        if (monthIndex === 0) {
            applyTheme('#000000', 'wtr');
        } else if (monthIndex === 1) {
            applyTheme('#000000', 'lve');
        } else if (monthIndex >= 2 && monthIndex <= 9) {
            applyTheme('#8cbe37');
        } else if (monthIndex === 10) {
            applyTheme('#000000', 'tky');
        } else if (monthIndex === 11) {
            applyTheme('#000000', 'cms');
        } else {
            applyTheme('#8cbe37');
        }
    }
    colorInput?.addEventListener('input', () => {
        localStorage.setItem('headerColor', colorInput.value);
        ['gradientLeft', 'gradientRight', 'useGradient'].forEach(k => localStorage.removeItem(k));
        if (themeSelector) themeSelector.value = '';
        applyTheme(colorInput.value);
    });
    [gradLeftInput, gradRightInput].forEach(inp => inp?.addEventListener('input', () => {
        if (themeSelector?.value) return;
        const l = gradLeftInput?.value || '#ffffff';
        const r = gradRightInput?.value || '#000000';
        localStorage.setItem('gradientLeft', l);
        localStorage.setItem('gradientRight', r);
        localStorage.setItem('useGradient', 'custom');
        localStorage.removeItem('headerColor');
        applyTheme(l, 'custom');
    }));
    themeSelector?.addEventListener('change', () => {
        const sel = themeSelector.value;
        if (!sel) {
            const l = localStorage.getItem('gradientLeft');
            const r = localStorage.getItem('gradientRight');
            if (l && r) applyTheme(l, 'custom');
            else if (colorInput?.value) applyTheme(colorInput.value);
            return;
        }
        ['gradientLeft', 'gradientRight', 'headerColor'].forEach(k => localStorage.removeItem(k));
        localStorage.setItem('useGradient', sel);
        applyTheme('#000000', sel);
        location.reload();
    });
    resetBtn?.addEventListener('click', () => {
        ['headerColor', 'useGradient', 'gradientLeft', 'gradientRight', 'globalTextColor', 'globalDarkTheme']
        .forEach(k => localStorage.removeItem(k));
        if (themeSelector) themeSelector.value = '';
        const monthIndex = new Date().getMonth();
        let defaultColor;
        if (monthIndex === 0) {
            const defaultColor = 'linear-gradient(to right, #374377, #bec7ad)';
        } else if (monthIndex === 1) {
            const defaultColor = 'linear-gradient(to right, #be5f37, #be3786)';
        } else if (monthIndex >= 2 && monthIndex <= 9) {
            const defaultColor = '#8cbe37';
        } else if (monthIndex === 10) {
            const defaultColor = 'linear-gradient(to right, #be9a37, #be5f37)';
        } else if (monthIndex === 11) {
            const defaultColor = 'linear-gradient(to right, green, red)';
        } else {
            const defaultColor = '#8cbe37';
        }
        if (colorInput) colorInput.value = defaultColor;
        if (gradLeftInput) gradLeftInput.value = defaultColor;
        if (gradRightInput) gradRightInput.value = defaultColor;
        applyTheme(defaultColor);
        location.reload();
    });
});