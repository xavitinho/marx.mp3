function populateVoiceList() {
    if (typeof speechSynthesis === "undefined") {
        return;
    }
    const voices = speechSynthesis.getVoices();
    for (let i = 0; i < voices.length; i++) {
        const option = document.createElement("option");
        option.textContent = `${voices[i].name} (${voices[i].lang})`;

        if (voices[i].default) {
            option.textContent += " — DEFAULT";
        }
        option.setAttribute("data-lang", voices[i].lang);
        option.setAttribute("data-name", voices[i].name);
        document.getElementById("voiceSelect").appendChild(option);
    }
}

populateVoiceList();

if (
    typeof speechSynthesis !== "undefined" &&
    speechSynthesis.onvoiceschanged !== undefined
) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

fetch('./store.json').then(response => {
    response.json().then(store => {
        let menu = document.getElementById('menu')
        Object.keys(store).forEach(autor => {
            let e = document.createElement('li')
            e.id = autor
            e.className = "autor visible"
            let html = `<a onclick="showtxts(\`${autor}\`)">${autor}</a><ul class = "invisible" id="#ul_${autor}">`
            store[autor].textos.forEach(({ titulo, url }) => {
                html += `<li class="texto visible" data-autor="${autor}"><a onclick="requestserver(\`${autor}\`, \`${titulo}\`, \`${url}\`)">${titulo}</a></li>`
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

let txttoread = {}

function requestserver(autor, titulo, url) {
    document.getElementById('erroplay').innerText = ''
    let button = document.getElementById('buttonplay')
    url = 'https://servermarxmp3.xaax.repl.co/?url=' + url
    let leitor = document.getElementById('leitor')
    leitor.innerText = 'carregando...'
    if (!url.includes('.pdf')) {
        fetch(url).then(response => {
            response.json().then(txt => {
                let e = document.createElement('div')
                let element = document.createElement('div')
                if (!txttoread[autor]) txttoread[autor] = {}
                if (!txttoread[autor][titulo]) {
                    txttoread[autor][titulo] = { progresso: 0, texto: [] }
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
                                console.log(p.tagName)
                                while (p.innerHTML.indexOf('href=') > -1) p.innerHTML = p.innerHTML.replace('href=', 'x')
                                txttoread[autor][titulo].texto.push(p.innerText)
                            }

                        }
                    } else element.innerText = txt.erro
                }
                txttoread[autor][titulo].texto.forEach(p => {
                    element.innerHTML += `<p>${p}</p>`
                })
                button.dataset.autor = autor
                button.dataset.titulo = titulo
                leitor.innerHTML = ''
                leitor.appendChild(element)
            })
        })
    } else {
        leitor.innerText = ' o texto selecionado está no formato .pdf e não será possível lê-lo'
    }
}

function play() {
    let erro = document.getElementById('erroplay')
    let button = document.getElementById('buttonplay')
    let { autor, titulo } = button.dataset
    if (titulo == 'none') erro.innerText = 'nenhum texto selecionado'
    else {
        erro.innerText = `falando ${titulo} de ${autor}`
        speak(autor, titulo)
    }
}

function speak(autor, titulo) {
    let progresso = txttoread[autor][titulo].progresso
    let total = txttoread[autor][titulo].texto.length
    document.getElementById('progresso').innerText = `${(progresso / total * 100).toFixed(0)}% :   ${progresso}/${total} parágrafos ouvidos`
    if (progresso == total) {
        document.getElementById('erroplay').innerText = `você concluiu o texto ${titulo} de ${autor}!`
        txttoread[autor][titulo].progresso = 0
        document.getElementById('leitor').innerHTML = ''
        document.getElementById('progresso').innerText = ''
        document.getElementById('buttonplay').dataset.titulo = 'none'
    } else {
        var to_speak = new SpeechSynthesisUtterance(txttoread[autor][titulo].texto[progresso]);
        window.speechSynthesis.speak(to_speak)
        to_speak.addEventListener("end", (event) => {
            txttoread[autor][titulo].progresso++
            speak(autor, titulo)
        })
    }
}
