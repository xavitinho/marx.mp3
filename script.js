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
                html += `<li class="texto visible" data-autor="${autor}"><a onclick="showtxt("${url}")">${titulo}</a></li>`
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
                        if(texto.className != 'texto visible') texto.className = 'texto visible'
                        autorvisible = true
                    }
                    else if(texto.className != 'texto invisible') texto.className = 'texto invisible'
                })
                if (autorvisible) {
                    if(autor.className != 'autor visible') autor.className = 'autor visible'
                    if(ul.className != 'visible') ul.className = 'visible'
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
