import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

interface Kare {
  satir: number; // karenin harita üzerindeki satır koordinatı
  sutun: number; // karenin harita üzerindeki sütun koordinatı
  mayin: boolean; // karenin mayın olup olmadığı
  acik: boolean; // karenin henüz açılıp açılmadığı bilgisi
  komsuMayinSayisi?: number; // karenin etrafında kaç tane mayın olduğu bilgisi
  isaretli: boolean; // karenin kullanıcı tarafından mayın olarak işaretlenip işaretlenmediği bilgisi
}

@Component({
  selector: 'app-game',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
})
export class GamePage {
  zorluk: string;
  harita: Kare[][] = [];
  mayinSayisi: number;
  satirSayisi = 20;
  sutunSayisi = 10;
  oyunSonu: boolean; // oyunun sonlanip sonlanmadigini belirten deger

  constructor(public route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.zorluk = params.zorluk;
      this.haritayiHazirla();
    });
  }

  private haritayiHazirla() {
    // zorluga gore toplam mayin sayisini belirle
    switch (this.zorluk) {
      case 'zor':
        this.mayinSayisi = 40; break;
      case 'orta':
        this.mayinSayisi = 35; break;
      case 'kolay':
      default:
        this.mayinSayisi = 30; break;
    }

    // karisik konumlardan mayin sayisi kadar al
    const mayinKonumlari = this.konumlariKaristir().slice(0, this.mayinSayisi);

    // harita karelerini varsayilan degerlerle ekle
    this.harita = [];
    for (let satir = 0; satir < this.satirSayisi; satir++) {
      const haritaSatiri: Kare[] = [];
      for (let sutun = 0; sutun < this.sutunSayisi; sutun++) {
        haritaSatiri.push({
          satir: satir,
          sutun: sutun,
          mayin: false,
          acik: false,
          isaretli: false
        });
      }
      this.harita.push(haritaSatiri);
    }

    // mayin konumlarini gezerek harita uzerinde mayin olarak isaretle
    for (const [satir, sutun] of mayinKonumlari) {
      this.harita[satir][sutun].mayin = true;
    }

    // butun kareleri gezerek cevresindeki mayin sayisini hesapla
    for (const haritaSatiri of this.harita) {
      for (const kare of haritaSatiri) {
        if (!kare.mayin) {
          kare.komsuMayinSayisi = this.komsuMayinSayisiHesapla(kare.satir, kare.sutun);
        }
      }
    }

    // arayuzu olusturmadan once haritamizi gorebilmek icin konsola yazdiralim
    console.log(this.harita.map(haritaSatiri => haritaSatiri.map(kare =>
      kare.mayin ? '*' : kare.komsuMayinSayisi
    )).join('\n'));
  }

  private konumlariKaristir(): number[][] {
    const konumlar = [];
    for (let i = 0; i < this.satirSayisi; i++) {
      for (let j = 0; j < this.sutunSayisi; j++) {
        konumlar.push([i, j]);
      }
    } // sonuc: [[0, 0], [0, 1], ..., [19, 9]] seklinde harita uzerindeki
    // butun koordinatlarin [satir, sutun] ikilileri

    for (let i = konumlar.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [konumlar[i], konumlar[j]] = [konumlar[j], konumlar[i]];
    }
    return konumlar;
  }

  private komsuKareleriAl(satir: number, sutun: number) {
    const komsuKareler = [];

    if (satir > 0) {
      if (sutun > 0) { komsuKareler.push(this.harita[satir - 1][sutun - 1]); } // sol ust
      komsuKareler.push(this.harita[satir - 1][sutun]); // ust
      if (sutun < (this.sutunSayisi - 1)) { komsuKareler.push(this.harita[satir - 1][sutun + 1]); } // sag ust
    }
    if (sutun > 0) { komsuKareler.push(this.harita[satir][sutun - 1]); } // sol
    if (sutun < (this.sutunSayisi - 1)) { komsuKareler.push(this.harita[satir][sutun + 1]); } // sag
    if (satir < (this.satirSayisi - 1)) {
      if (sutun > 0) { komsuKareler.push(this.harita[satir + 1][sutun - 1]); } // sol alt
      komsuKareler.push(this.harita[satir + 1][sutun]); // alt
      if (sutun < (this.sutunSayisi - 1)) { komsuKareler.push(this.harita[satir + 1][sutun + 1]); } // sag alt
    }

    return komsuKareler;
  }

  private komsuMayinSayisiHesapla(satir: number, sutun: number): number {
    const komsuKareler = this.komsuKareleriAl(satir, sutun);

    // komsu karelerden mayin olanları filtrele ve sayisini don
    return komsuKareler.filter(kare => kare.mayin).length;
  }

  private butunGuvenliKarelerAcik(): boolean {
    let acikKareSayisi = 0;
    for (const satir of this.harita) {
      for (const kare of satir) {
        if (kare.acik && !kare.mayin) {
          acikKareSayisi++;
        }
      }
    }
    const tumKareler = this.satirSayisi * this.sutunSayisi;
    const toplamGuvenliKareSayisi = tumKareler - this.mayinSayisi;
    return acikKareSayisi === toplamGuvenliKareSayisi;
  }

  public kareyiAc(kare: Kare) {
    if (this.oyunSonu) { return; } // oyun sonlandiysa hicbir sey yapmadan cik
    kare.acik = true;
    if (kare.mayin) { // tiklanan kare mayin ise
      this.oyunSonu = true;
      alert('Kaybettiniz...')
    } else if (this.butunGuvenliKarelerAcik()) { // tiklanan kare mayin değil ve mayin olmayan butun kareler acik ise
      this.oyunSonu = true;
      alert('Kazandiniz!');
    } else {
      if (kare.komsuMayinSayisi === 0) {
        const komsuKareler = this.komsuKareleriAl(kare.satir, kare.sutun);
        komsuKareler
          .filter(komsuKare => !komsuKare.acik) // acik olmayan komsu kareleri filtrele
          .forEach(komsuKare => this.kareyiAc(komsuKare)); // filtrelenen komsu kareleri ac
      }
    }
  }

  public yeniOyun() {
    this.oyunSonu = false;
    this.haritayiHazirla();
  }

}
