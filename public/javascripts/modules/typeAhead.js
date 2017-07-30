import axios from 'axios'; 
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
              <strong>${store.name}</strong>
            </a>
        `;
    }).join(' '); 
}


function typeAhead(search) {
    if (!search) return;

    const searchInput = search.querySelector('input[name="search"]')
    const searchResults =search.querySelector('.search__results'); 

    searchInput.on('input', function() {
        if (!this.value) {
            searchresults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';

        axios
            .get(`/api/search?q=${this.value}`)
            .then(res =>  {
                if (res.data.length) {
                    const html = searchResultsHTML(res.data);
                    searchResults.innerHTML = dompurify.sanitize(html);
                    return; 
                }
                searchResults.innerHTML = `
                    <div class="search__result">No results for ${dompurify.sanitize(this.value)}</div>
                `;
            })
            .catch(err => {
                console.error(err); 
            })

    });

    searchInput.on('keyup', e => {
        if (![38,40,13].includes(e.keyCode)) return;
        e.preventDefault(); 

        const activeClass = 'search__result--active'; 
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        if (!items.length) return; 

        let next; 
        if (current) {
            if (e.keyCode === 40)
                next = current.nextElementSibling ? current.nextElementSibling : items[0];
            else if (e.keyCode === 38)
                next = current.previousElementSibling ? current.previousElementSibling : items[items.length-1];
            else if (e.keyCode === 13) {
                window.location = current.href;
                return;
            }
        } else { // nocurrent
            if (e.keyCode === 40)
                next = items[0];
            else if (e.keyCode === 38)
                next = items[items.length-1];
        }

        if (current)
            current.classList.remove(activeClass); 
        next.classList.add(activeClass); 
    });
}

export default typeAhead; 