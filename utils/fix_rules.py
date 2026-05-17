import re

with open('../pages/rules.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (r'<h1>Community Rules</h1>', r'<h1 data-i18n="rules_title">Community Rules</h1>'),
    (r'<p>Untuk menjaga KATA-KITA tetap menjadi ruang kecil yang penuh kebaikan, setiap pengguna wajib mematuhi aturan berikut:</p>', r'<p data-i18n="rules_subtitle">Untuk menjaga KATA-KITA tetap menjadi ruang kecil yang penuh kebaikan, setiap pengguna wajib mematuhi aturan berikut:</p>'),
    (r'<h3>1. Menjaga Anonimitas dan Privasi</h3>', r'<h3 data-i18n="rule1_title">1. Menjaga Anonimitas dan Privasi</h3>'),
    (r'<p>Demi kenyamanan bersama, mohon untuk tidak mencantumkan identitas pribadi seperti nama asli, kelas, nomor kamar, maupun detail spesifik lainnya dalam setiap unggahan. Prinsip utama platform ini adalah keanoniman guna memastikan setiap orang dapat berekspresi tanpa rasa terancam oleh penilaian sosial.</p>', r'<p data-i18n="rule1_desc">Demi kenyamanan bersama, mohon untuk tidak mencantumkan identitas pribadi seperti nama asli, kelas, nomor kamar, maupun detail spesifik lainnya dalam setiap unggahan. Prinsip utama platform ini adalah keanoniman guna memastikan setiap orang dapat berekspresi tanpa rasa terancam oleh penilaian sosial.</p>'),
    (r'<h3>2. Dukungan Empati dan Validasi Emosional</h3>', r'<h3 data-i18n="rule2_title">2. Dukungan Empati dan Validasi Emosional</h3>'),
    (r'<p>Gunakanlah bahasa yang santun dan suportif dalam memberikan tanggapan. Kami sangat menghargai interaksi yang membangun, penuh empati, dan menghargai perasaan sesama teman tanpa adanya penghakiman \(no judging\).</p>', r'<p data-i18n="rule2_desc">Gunakanlah bahasa yang santun dan suportif dalam memberikan tanggapan. Kami sangat menghargai interaksi yang membangun, penuh empati, dan menghargai perasaan sesama teman tanpa adanya penghakiman (no judging).</p>'),
    (r'<h3>3. Lingkungan Bebas Perundungan \(Zero Bullying\)</h3>', r'<h3 data-i18n="rule3_title">3. Lingkungan Bebas Perundungan (Zero Bullying)</h3>'),
    (r'<p>Kami menerapkan kebijakan toleransi nol terhadap segala bentuk perundungan, kata-kata kasar, hinaan, maupun ancaman. Segala konten yang mengandung unsur tersebut akan secara otomatis dihapus oleh sistem demi menjaga ekosistem komunikasi yang sehat.</p>', r'<p data-i18n="rule3_desc">Kami menerapkan kebijakan toleransi nol terhadap segala bentuk perundungan, kata-kata kasar, hinaan, maupun ancaman. Segala konten yang mengandung unsur tersebut akan secara otomatis dihapus oleh sistem demi menjaga ekosistem komunikasi yang sehat.</p>'),
    (r'<h3>4. Fokus pada Pengungkapan Diri yang Positif</h3>', r'<h3 data-i18n="rule4_title">4. Fokus pada Pengungkapan Diri yang Positif</h3>'),
    (r'<p>Gunakan ruang ini untuk merefleksikan dan mengungkapkan perasaan pribadi Anda secara tulus \(self-disclosure\). Mohon untuk tidak menggunakan platform ini sebagai sarana menyebarkan rumor, gosip, atau membuka aib pihak lain di lingkungan asrama.</p>', r'<p data-i18n="rule4_desc">Gunakan ruang ini untuk merefleksikan dan mengungkapkan perasaan pribadi Anda secara tulus (self-disclosure). Mohon untuk tidak menggunakan platform ini sebagai sarana menyebarkan rumor, gosip, atau membuka aib pihak lain di lingkungan asrama.</p>'),
    (r'<h3>5. Keamanan dan Kesejahteraan Subjek</h3>', r'<h3 data-i18n="rule5_title">5. Keamanan dan Kesejahteraan Subjek</h3>'),
    (r'<p>Demi keselamatan Anda, dilarang keras mengunggah konten yang merujuk pada tindakan menyakiti diri sendiri \(self-harm\) atau orang lain. Platform ini dilengkapi dengan algoritma deteksi kata kunci darurat untuk memberikan bantuan segera jika ditemukan indikasi bahaya. Apabila Anda dalam kondisi darurat, sangat disarankan untuk segera menghubungi pendamping asrama atau pihak medis terkait.</p>', r'<p data-i18n="rule5_desc">Demi keselamatan Anda, dilarang keras mengunggah konten yang merujuk pada tindakan menyakiti diri sendiri (self-harm) atau orang lain. Platform ini dilengkapi dengan algoritma deteksi kata kunci darurat untuk memberikan bantuan segera jika ditemukan indikasi bahaya. Apabila Anda dalam kondisi darurat, sangat disarankan untuk segera menghubungi pendamping asrama atau pihak medis terkait.</p>'),
    (r'<h3>6. Pemanfaatan Fitur Pelaporan \(Report\)</h3>', r'<h3 data-i18n="rule6_title">6. Pemanfaatan Fitur Pelaporan (Report)</h3>'),
    (r'<p>Mari bersama-sama menjaga komunitas ini. Jika Anda menemukan unggahan atau interaksi yang melanggar ketentuan di atas, mohon kesediaannya untuk menggunakan fitur pelaporan \(Report\) agar tim admin dapat segera menindaklanjutinya demi keamanan privasi seluruh siswi.</p>', r'<p data-i18n="rule6_desc">Mari bersama-sama menjaga komunitas ini. Jika Anda menemukan unggahan atau interaksi yang melanggar ketentuan di atas, mohon kesediaannya untuk menggunakan fitur pelaporan (Report) agar tim admin dapat segera menindaklanjutinya demi keamanan privasi seluruh siswi.</p>'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('../pages/rules.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated rules.html')
