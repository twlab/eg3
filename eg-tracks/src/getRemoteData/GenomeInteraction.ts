export class GenomeInteraction {
  constructor(
    public locus1: { [key: string]: any },
    public locus2: { [key: string]: any },
    public score = 0,
    public name: string = "",
    public color: string = "",
    public id: string = "",
    public bpLocus1?: any,
    public bpLocus2?: any
  ) {
    this.locus1 = locus1;
    this.locus2 = locus2;
    this.score = score;
    this.name = name;
    this.color = color;
    this.id = id;
    this.bpLocus1 = bpLocus1;
    this.bpLocus2 = bpLocus2;
  }

  getDistance() {
    return Math.round(Math.abs(this.locus1.start - this.locus2.start));
  }
}
