/**
 * ============================================
 * AMELIA AI - ACADEMIC TOOLS
 * Paper paraphrasing, citation, and research tools
 * ============================================
 */

class AcademicTools {
    constructor() {
        this.citationStyles = ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard'];
        this.thesaurus = new Map();
        this.initThesaurus();
    }

    init() {
        console.log('[AcademicTools] Initializing...');
        return this;
    }

    initThesaurus() {
        this.thesaurus.set('menggunakan', ['memakai', 'memanfaatkan', 'mengaplikasikan']);
        this.thesaurus.set('menunjukkan', ['memperlihat', 'membuktikan', 'menyatakan']);
        this.thesaurus.set('penting', ['signifikan', 'esensial', 'krusial', 'vital']);
        this.thesaurus.set('beberapa', ['sejumlah', 'sebagian', 'antara lain']);
        this.thesaurus.set('karena', ['disebabkan oleh', 'oleh karena']);
        this.thesaurus.set('tetapi', ['namun', 'namun demikian', 'akan tetapi']);
        this.thesaurus.set('juga', ['selain itu', 'demikian pula', 'serta', 'lagipula']);
        this.thesaurus.set('show', ['demonstrate', 'illustrate', 'reveal', 'indicate']);
        this.thesaurus.set('use', ['utilize', 'employ', 'apply', 'implement']);
        this.thesaurus.set('because', ['since', 'as', 'due to', 'owing to']);
        this.thesaurus.set('however', ['nevertheless', 'nonetheless', 'yet']);
        this.thesaurus.set('therefore', ['thus', 'hence', 'consequently']);
    }

    async paraphrase(text, options) {
        if (!text || text.trim().length === 0) {
            return { success: false, error: 'No text provided' };
        }

        var settings = options || {};
        settings.language = settings.language || 'id';
        settings.style = settings.style || 'academic';

        try {
            if (window.AIConnection && window.AIConnection.available) {
                var prompt = this.buildParaphrasePrompt(text, settings);
                var result = await window.AIConnection.chat(prompt);
                return { success: true, original: text, paraphrased: result, language: settings.language };
            }

            var localResult = this.localParaphrase(text, settings);
            return { success: true, original: text, paraphrased: localResult, note: 'Using local paraphrasing' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buildParaphrasePrompt(text, settings) {
        var langName = settings.language === 'id' ? 'Bahasa Indonesia' : 'English';
        return 'Paraphrase the following text in ' + langName + ' with academic style. Maintain meaning, use formal language. Text: "' + text + '"';
    }

    localParaphrase(text, settings) {
        var result = text;
        var replacements = [
            ['oleh karena itu', 'dengan demikian'],
            ['sebagai contoh', 'misalnya'],
            ['juga', 'selain itu']
        ];
        for (var i = 0; i < replacements.length; i++) {
            var from = replacements[i][0];
            var to = replacements[i][1];
            result = result.replace(new RegExp(from, 'gi'), to);
        }
        return result;
    }

    generateCitation(data, style) {
        style = style || 'APA';
        var authors = this.formatAuthors(data.authors, style);
        var year = data.year ? '(' + data.year + ')' : '(n.d.)';
        var title = data.title || 'Untitled';
        var source = data.source || '';
        var url = data.url || '';

        switch (style.toUpperCase()) {
            case 'APA': return authors + ' ' + year + '. ' + title + '. ' + source + (url ? ' ' + url : '');
            case 'MLA': return authors + ' "' + title + '" ' + source + (year ? ', ' + year + ', ' : ', ') + url + '.';
            case 'CHI': case 'CHICAGO': return authors + ' "' + title + '" ' + source + (year ? '. ' + year + '.' : '.') + (url ? ' ' + url : '');
            case 'IEEE': return authors.replace(/ and /g, ', ') + ', "' + title + '," ' + source + (year ? ', ' + year + '.' : '.');
            case 'HARVARD': return authors + ' ' + year + ', "' + title + '"' + (source ? ', ' + source : '') + (url ? ', ' + url : '') + '.';
            default: return authors + ' ' + year + '. ' + title + '. ' + source;
        }
    }

    formatAuthors(authors, style) {
        if (!authors || authors.length === 0) return 'Anonymous';
        
        var formatOne = function(author, idx, total) {
            if (typeof author === 'string') {
                var parts = author.split(' ');
                var lastName = parts.pop();
                var firstName = parts.join(' ');
                return lastName + ', ' + firstName.charAt(0) + '.';
            }
            return author.name || 'Unknown';
        };

        if (authors.length === 1) return formatOne(authors[0], 0, 1);
        if (authors.length === 2) return formatOne(authors[0], 0, 2) + ', & ' + formatOne(authors[1], 1, 2);
        
        var all = authors.map(function(a, i) { return formatOne(a, i, authors.length); });
        var commaIdx = all[all.length - 1].indexOf(',');
        if (commaIdx > -1) {
            all[all.length - 1] = '& ' + all[all.length - 1];
        }
        return all.join(', ');
    }

    async checkGrammar(text, language) {
        language = language || 'id';
        if (window.AIConnection && window.AIConnection.available) {
            var prompt = language === 'id' 
                ? 'Periksa tata bahasa teks berikut: "' + text + '"'
                : 'Check grammar: "' + text + '"';
            var result = await window.AIConnection.chat(prompt);
            return { success: true, original: text, corrected: result };
        }
        return { success: true, original: text, note: 'Full grammar check requires AI' };
    }

    async summarize(text, options) {
        options = options || {};
        var maxLength = options.maxLength || 200;
        var language = options.language || 'id';

        if (window.AIConnection && window.AIConnection.available) {
            var prompt = language === 'id'
                ? 'Rangkum dalam ' + maxLength + ' kata: "' + text + '"'
                : 'Summarize in ' + maxLength + ' words: "' + text + '"';
            var result = await window.AIConnection.chat(prompt);
            return { success: true, original: text, summary: result };
        }

        var summary = this.simpleSummarize(text, maxLength);
        return { success: true, original: text, summary: summary };
    }

    simpleSummarize(text, maxLength) {
        var sentences = text.split(/(?<=[.!?])\s+/);
        var words = text.toLowerCase().split(/\W+/);
        var freq = {};
        var stopWords = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'the', 'and', 'of']);
        
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (w.length > 3 && !stopWords.has(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        }

        var scored = sentences.map(function(s, i) {
            var sWords = s.toLowerCase().split(/\W+/);
            var score = 0;
            for (var j = 0; j < sWords.length; j++) {
                if (freq[sWords[j]]) score += freq[sWords[j]];
            }
            if (i === 0 || i === sentences.length - 1) score *= 1.5;
            return { sentence: s, score: score / Math.max(sWords.length, 1) };
        });

        scored.sort(function(a, b) { return b.score - a.score; });
        
        var result = '';
        for (var i = 0; i < scored.length; i++) {
            if ((result + ' ' + scored[i].sentence).length <= maxLength * 6) {
                result += (result ? ' ' : '') + scored[i].sentence;
            }
        }
        return result || text.substring(0, maxLength * 6);
    }

    extractKeywords(text, maxKeywords) {
        maxKeywords = maxKeywords || 10;
        var words = text.toLowerCase().split(/\W+/);
        var stopWords = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'the', 'and', 'of', 'to', 'is', 'it']);
        var freq = {};
        
        for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (w.length > 3 && !stopWords.has(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        }
        
        var sorted = Object.entries(freq).sort(function(a, b) { return b[1] - a[1]; });
        return sorted.slice(0, maxKeywords).map(function(item) { return { word: item[0], count: item[1] }; });
    }

    async checkPlagiarism(text) {
        if (window.AIConnection && window.AIConnection.available) {
            var result = await window.AIConnection.chat('Check plagiarism for: ' + text);
            return { success: true, original: text, result: result };
        }
        return { success: true, note: 'Full check requires AI and database' };
    }

    getStatus() {
        return { citationStyles: this.citationStyles, thesaurusSize: this.thesaurus.size };
    }
}

window.AcademicTools = AcademicTools;

