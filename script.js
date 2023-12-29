var voices;

function populateVoiceList() {
    if (typeof speechSynthesis === "undefined") return;
    voices = speechSynthesis.getVoices();
    for (let i = 0; i < voices.length; i++) {
        const option = document.createElement("option");
        option.textContent = `${voices[i].name} (${voices[i].lang})`;
        if (voices[i].default) option.textContent += " — DEFAULT";
        option.setAttribute("data-lang", voices[i].lang);
        option.setAttribute("data-name", voices[i].name);
        document.getElementById("voiceSelect").appendChild(option);
    }
}
populateVoiceList();

if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined)
    speechSynthesis.onvoiceschanged = populateVoiceList;

fetch('./store.json').then(response => {
    response.json().then(store => {
        let menu = document.getElementById('menu')
        Object.keys(store).forEach(autor => {
            let e = document.createElement('li')
            e.id = autor
            e.className = "autor visible"
            let html = `<a onclick="showtxts(\`${autor}\`)">${autor}</a><ul class = "invisible" id="#ul_${autor}">`
            store[autor].textos.forEach(({ titulo, url }) => {
                let inferno = titulo.includes('"') ? "'" : '"'
                html += `<li class="texto visible" data-autor="${autor}"><a onclick=${inferno}requestserver(\`${autor}\`, \`${titulo}\`, \`${url}\`)${inferno}>${titulo}</a></li>`
            })
            html += '</ul>'
            e.innerHTML = html
            menu.appendChild(e)
        })
        let search = document.getElementById("search")
        let autores = menu.querySelectorAll('.autor')
        search.addEventListener("input", (e) => {
            let inputed = e.target.value.toLowerCase()
            autores.forEach(autor => {
                let autorvisible = false
                let ul = document.getElementById('#ul_' + autor.id)
                let textos = autor.querySelectorAll('.texto')
                textos.forEach(texto => {
                    if (texto.textContent.toLowerCase().includes(inputed) || texto.dataset.autor.toLowerCase().includes(inputed)) {
                        if (texto.className != 'texto visible') texto.className = 'texto visible'
                        autorvisible = true
                    }
                    else if (texto.className != 'texto invisible') texto.className = 'texto invisible'
                })
                if (autorvisible) {
                    if (autor.className != 'autor visible') autor.className = 'autor visible'
                    if (ul.className != 'visible') ul.className = 'visible'
                }
                else {
                    if (autor.className != 'autor invisible') autor.className = 'autor invisible'
                    if (ul.className != 'invisible') ul.className = 'invisible'
                }
                if (inputed == '' && ul.className != 'invisible') ul.className = 'invisible'
            })
        })
    })
})

function showtxts(autor) {
    e = document.getElementById('#ul_' + autor)
    e.className = e.className == 'invisible' ? 'visible' : 'invisible'
}


let txttoread = JSON.parse(localStorage.getItem('txts'))
if(!txttoread) txttoread = {}
atualizafavoritos()

async function requestserver(autor, titulo, url) {
    let button = document.getElementById('buttonplay')
    let leitor = document.getElementById('leitor')
    let erro = document.getElementById('errotxt')
    leitor.innerHTML = ''
    erro.innerText = 'carregando...'
    let element = document.createElement('div')
    if (!txttoread[autor]) txttoread[autor] = {}
    if (!txttoread[autor][titulo]) {
        if (!url) {
            erro.innerText = 'houve um erro. tente novamente.'
        } else {
            url = 'https://servermarxmp3.xaax.repl.co/?url=' + url
            txttoread[autor][titulo] = { progresso: 0, url, texto: [] }
            if (!url.includes('.pdf')) {
                let response = await fetch(url).catch( e => {
                    erro.innerText = 'houve um erro, tente novamente'
                    return;
                })
                let txt = await response.json()
                let e = document.createElement('div')
                if (!txt.erro) {
                    e.innerHTML = txt
                    let paragrafos = e.children
                    for (let par of paragrafos) {
                        let p = par.cloneNode(true)
                        if (p.className != "toplink" &&
                            p.className != "info" &&
                            p.className != "link" &&
                            p.className != "tabela_datas" &&
                            p.innerText.length > 0 &&
                            p.tagName != 'TITLE' &&
                            p.tagName != 'TABLE' &&
                            p.tagName != 'STYLE') {
                            p.innerHTML = p.innerHTML.replaceAll('href=', 'x')
                            txttoread[autor][titulo].texto.push(p.innerText)
                        }

                    }
                    erro.innerText = ''
                } else element.innerText = txt.erro
            } else {
                erro.innerText = ' o texto selecionado está no formato .pdf e não será possível lê-lo'
            }
        }
    } else {
        erro.innerText = ''
    }
    if(erro.innerText.length == 0) {
        txttoread[autor][titulo].texto.forEach(p => {
            element.innerHTML += `<p>${p}</p>`
        })
        button.dataset.autor = autor
        button.dataset.titulo = titulo
        leitor.appendChild(element)
    } else {
        txttoread[autor][titulo] = undefined
    }
    atualizafavoritos()
}

function play() {
    window.speechSynthesis.cancel()
    let erro = document.getElementById('erroplay')
    let button = document.getElementById('buttonplay')
    let { autor, titulo } = button.dataset
    if (titulo == 'none') erro.innerText = 'nenhum texto selecionado'
    else {
        erro.innerHTML = `tocando <strong>${titulo}</strong> de ${autor}`
        let buttonclear = document.getElementById('buttonclear')
        buttonclear.dataset.autor = autor
        buttonclear.dataset.titulo = titulo
        speak(autor, titulo)
        let buttonpause = document.getElementById('buttonpause')
        buttonpause.className = 'ativo'
        buttonpause.innerText = 'pausar'
        document.getElementById('buttonclear').className = 'button'
    }
}

function pause() {
    let button = document.getElementById('buttonpause')
    if (button.className != 'disabled') {
        if (button.innerText == 'pausar') {
            button.innerText = 'continuar'
            window.speechSynthesis.pause()
        } else {
            button.innerText = 'pausar'
            window.speechSynthesis.resume()
        }
    }
}

function limpar(autor, titulo) {
    let button = document.getElementById('buttonclear')
    if(autor && titulo) {
        txttoread[autor][titulo] = undefined
    } else if(button.className != 'disabled') {
        const { autor, titulo } = button.dataset
        txttoread[autor][titulo].progresso = 0
        window.speechSynthesis.cancel()
        document.getElementById('progresso').innerText = ''
        document.getElementById('buttonplay').dataset.titulo = 'none'
        document.getElementById('buttonclear').className = 'disabled'
        document.getElementById('buttonpause').className = 'disabled'
        document.getElementById('erroplay').innerText = ''
    }
    atualizafavoritos()
}

function speak(autor, titulo) {
    let progresso = txttoread[autor][titulo].progresso
    let total = txttoread[autor][titulo].texto.length
    document.getElementById('progresso').innerText = `${(progresso / total * 100).toFixed(0)}% :   ${progresso}/${total} parágrafos ouvidos`
    if (progresso == total) {
        document.getElementById('erroplay').innerText = `você concluiu o texto ${titulo} de ${autor}!`
        limpar()
    } else {
        var to_speak = new SpeechSynthesisUtterance(txttoread[autor][titulo].texto[progresso]);
        const selectedOption = document.getElementById("voiceSelect").selectedOptions[0].getAttribute("data-name");
        for (let i = 0; i < voices.length; i++) {
            if (voices[i].name === selectedOption) {
                to_speak.voice = voices[i];
            }
        }
        window.speechSynthesis.speak(to_speak)
        to_speak.addEventListener("end", (event) => {
            txttoread[autor][titulo].progresso++
            atualizafavoritos()
            speak(autor, titulo)
        })
    }
}


function showfavoritos() {
    let e = document.getElementById('favoritos')
    e.style.display = e.style.display == 'none' ? 'block' : 'none'
    e = document.getElementsByTagName('seta')[0]
    e.innerText = e.innerText == '▲' ? '▼' : '▲'
}

function atualizafavoritos() {
    localStorage.setItem('txts', JSON.stringify(txttoread))
    let menu = document.getElementById('menufavoritos')
    menu.innerHTML = ''
    Object.keys(txttoread).forEach(autor => {
        let visible = false
        let e = document.createElement('div')
        let html = `<a class="autorfavoritos">${autor}</a><ul>`
        Object.keys(txttoread[autor]).forEach(texto => {
            if (txttoread[autor][texto] && txttoread[autor][texto].progresso > 0) {
                let inferno = texto.includes('"') ? "'" : '"'
                html += `<li><a style="font-weight: bold;" onclick=${inferno}requestserver(\`${autor}\`, \`${texto}\`)${inferno}>
                        ${texto} (${txttoread[autor][texto].progresso}/${txttoread[autor][texto].texto.length} )
                        </a><br>
                        <a style="color: #f66; font-size: .8em; font-weight: bold;" 
                        onclick=${inferno}limpar(\`${autor}\`, \`${texto}\`)${inferno}>× remover da memória </a></li>`
                visible = true
            }
        })
        html += '</ul>'
        e.innerHTML = html
        if (visible) menu.appendChild(e)
    })
}

