import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {randomUUID} from 'node:crypto';
import {db} from '../server/db';
import {hashPassword} from '../server/auth';
const id=randomUUID(),email=`browser-${id}@test.invalid`,password=randomUUID()+randomUUID();
test.beforeAll(async()=>{await db('users').insert({id,email,name:'Pengelola Test',role:'admin',password:await hashPassword(password),active:true});});
test.afterAll(async()=>{await db('users').where({id}).delete();await db.destroy();});
for(const width of [375,768,1440])test(`office accessibility, navigation and layout ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/office');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Kata sandi',{exact:true}).fill(password);await page.getByRole('button',{name:'Masuk',exact:true}).click();await expect(page.getByRole('heading',{name:'Konten Portal',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Terbitkan',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.screenshot({path:`artifacts/cms/office-${width}.png`,fullPage:true});
 for(const section of ['Berita','Produk','Media','Konsultasi','Laporan','Pengguna','Pengaturan']){await page.getByRole('navigation',{name:'Menu office'}).getByRole('button',{name:section,exact:true}).click();await expect(page.getByRole('heading',{name:section,exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Keluar',exact:true}).click();await expect(page.getByRole('heading',{name:'Masuk ke office'})).toBeVisible();
});
test('article draft editor and protected preview',async({page})=>{
 await page.goto('/office');await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Kata sandi',{exact:true}).fill(password);await page.getByRole('button',{name:'Masuk',exact:true}).click();await page.getByRole('navigation',{name:'Menu office'}).getByRole('button',{name:'Berita',exact:true}).click();await page.getByRole('button',{name:'Tulis berita'}).click();
 const slug='browser-'+randomUUID();await page.getByLabel('Judul',{exact:true}).fill('Berita pengujian browser');await page.getByLabel('Slug halaman').fill(slug);await page.getByLabel('Ringkasan',{exact:true}).fill('Ringkasan pengujian alur editorial.');await page.getByLabel('Teks',{exact:true}).fill('Isi artikel untuk pengujian, tidak untuk diterbitkan.');await page.getByRole('button',{name:'Simpan draf'}).click();await expect(page.getByRole('button',{name:/Berita pengujian browser/})).toBeVisible();await page.getByRole('button',{name:/Berita pengujian browser/}).click();await page.getByRole('button',{name:'Ajukan tinjauan'}).click();await expect(page.getByText('Draf diajukan untuk ditinjau.')).toBeVisible();
 const r=await db('documents').where({slug}).first();expect(r.status).toBe('review');expect(r.published).toBeNull();await page.goto(`/office/preview/${r.id}`);await expect(page.getByRole('heading',{name:'Berita pengujian browser'})).toBeVisible();await db('documents').where({id:r.id}).delete();
});
test('news empty state and real consultation saves once',async({page})=>{
 await page.goto('/berita');await expect(page.getByRole('heading',{name:'Kabar dan kegiatan'})).toBeVisible();await page.goto('/');await page.locator('.header-cta').click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Nama',{exact:true}).fill('Browser Konsultasi');await dialog.getByLabel('Sekolah / organisasi').fill('Sekolah Browser');await dialog.getByLabel('Email',{exact:true}).fill('browser@test.invalid');await dialog.getByRole('checkbox',{name:'Pembelajaran digital',exact:true}).check();await dialog.getByLabel('Ceritakan kebutuhan Anda').fill('Perlu diskusi infrastruktur jaringan sekolah.');await dialog.getByRole('checkbox',{name:/Saya menyetujui/}).check();await dialog.getByRole('button',{name:'Kirim kebutuhan'}).click();await expect(dialog.getByRole('heading',{name:'Kebutuhan Anda sudah kami terima.'})).toBeVisible();await db('inquiries').where({email:'browser@test.invalid'}).delete();
});
