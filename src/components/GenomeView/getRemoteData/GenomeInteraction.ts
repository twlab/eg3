export class GenomeInteraction {
  constructor(
    public locus1: { [key: string]: any },
    public locus2: { [key: string]: any },
    public score = 0,
    public name: string = '',
    public color: string = ''
  ) {
    this.locus1 = locus1;
    this.locus2 = locus2;
    this.score = score;
    this.name = name;
    this.color = color;
  }

  getDistance() {
    return Math.round(Math.abs(this.locus1.start - this.locus2.start));
  }
}
