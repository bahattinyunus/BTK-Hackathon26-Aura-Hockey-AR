import { Config } from './config.js';

export const STORY_CHAPTERS = [
    {
        id: 0,
        title: "Bölüm 1: Metro Hayaletleri",
        npc: "S1NYAL",
        dialogue: [
            "Uyan, veri gladyatörü. Neo-Ankara'nın yeraltı hatlarındasın.",
            "Burada tek kural var: Pakı kaçırma, sistemini koru.",
            "AI-01 seni test edecek. Onu geçebilirsen Kızılay Core'a bir adım daha yaklaşırsın."
        ],
        goal: "3 puan topla",
        aiSpeedMult: 0.8,
        themeColor: 0x00ffff
    },
    {
        id: 1,
        title: "Bölüm 2: Neon Pazarı",
        npc: "V3RI",
        dialogue: [
            "Fena değilsin ama burası farklı. Veri akışı daha hızlı.",
            "Rakiplerin artık sadece pakı izlemiyor, senin hamlelerini tahmin ediyorlar.",
            "Dikkat et, momentum her şeydir."
        ],
        goal: "5 puan topla",
        aiSpeedMult: 1.1,
        themeColor: 0xff00ff
    },
    {
        id: 2,
        title: "Bölüm 3: Kızılay Core",
        npc: "NULL_PTR",
        dialogue: [
            "Core'a ulaştın. Burası sistemin kalbi.",
            "Gerçeklik burada bükülür. AI artık senin düşüncelerini okuyor.",
            "Fever Mode'u kullanmazsan bu kaosta şansın yok."
        ],
        goal: "7 puan topla",
        aiSpeedMult: 1.4,
        themeColor: 0xff0000
    }
];

export class Narrative {
    constructor() {
        this.currentChapterIndex = 0;
        this.overlay = null;
        this.textElement = null;
        this.npcElement = null;
        this.isTyping = false;
        this.currentDialogueIndex = 0;
    }

    init() {
        this.createUI();
    }

    createUI() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'narrative-overlay';
        this.overlay.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-500 hidden';
        this.overlay.innerHTML = `
            <div id="narrative-box" class="bg-black/80 border-2 border-cyan-500/50 p-8 max-w-lg w-full rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.2)]">
                <div class="flex items-center gap-4 mb-4 border-b border-cyan-500/20 pb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg animate-pulse flex items-center justify-center">
                        <span class="text-black font-black text-xl">#</span>
                    </div>
                    <div>
                <h2 id="npc-name" class="text-cyan-400 font-mono text-xs tracking-widest uppercase font-black">---</h2>
                <h3 id="chapter-title" class="text-white font-bold opacity-40 text-[9px] uppercase tracking-[0.2em]">Neo-Ankara 2026</h3>
            </div>
        </div>
        <div class="min-h-[120px] max-h-[200px] overflow-y-auto mb-6 custom-scrollbar">
            <p id="narrative-text" class="text-white font-mono text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words italic opacity-90">---</p>
        </div>
                <div class="flex justify-end">
                    <button id="next-dialogue" class="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 rounded-lg border border-cyan-500/50 transition-all font-mono text-xs uppercase tracking-widest">Devam Et [Spaced]</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);

        this.textElement = document.getElementById('narrative-text');
        this.npcElement = document.getElementById('npc-name');
        this.titleElement = document.getElementById('chapter-title');

        document.getElementById('next-dialogue').addEventListener('click', () => this.nextDialogue());
        window.addEventListener('keydown', (e) => { if (e.code === 'Space') this.nextDialogue(); });
    }

    showChapter(index) {
        this.currentChapterIndex = index;
        const chapter = STORY_CHAPTERS[index];
        this.currentDialogueIndex = 0;

        this.npcElement.innerText = chapter.npc;
        this.titleElement.innerText = chapter.title;

        this.overlay.classList.remove('hidden');
        // Force reflow for transition
        void this.overlay.offsetWidth;

        this.overlay.classList.remove('opacity-0');
        this.overlay.classList.add('opacity-100');

        this.typeText(chapter.dialogue[0]);
    }

    typeText(text) {
        if (this.isTyping) return;
        this.isTyping = true;
        this.textElement.innerText = "";
        let i = 0;

        const type = () => {
            if (i < text.length) {
                this.textElement.innerText += text.charAt(i);
                i++;
                setTimeout(type, 30);
            } else {
                this.isTyping = false;
            }
        };
        type();
    }

    nextDialogue() {
        if (this.isTyping) return;

        const chapter = STORY_CHAPTERS[this.currentChapterIndex];
        this.currentDialogueIndex++;

        if (this.currentDialogueIndex < chapter.dialogue.length) {
            this.typeText(chapter.dialogue[this.currentDialogueIndex]);
        } else {
            this.close();
        }
    }

    close() {
        this.overlay.classList.remove('opacity-100');
        this.overlay.classList.add('opacity-0');
        setTimeout(() => {
            this.overlay.classList.add('hidden');
            if (this.onClose) this.onClose();
        }, 500);
    }

    getChapterSettings() {
        return STORY_CHAPTERS[this.currentChapterIndex];
    }
}
