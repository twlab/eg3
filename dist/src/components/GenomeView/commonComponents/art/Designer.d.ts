/**
 * An object that designs visualizations.  A Designer's design() method returns an array of object for a component to
 * interpret.  This provides flexibility: a Designer can make a design without worrying about specifics of <canvas>,
 * <svg>, etc.
 *
 * @author Silas Hsu
 */
declare class Designer {
    design(): void;
}
export default Designer;
