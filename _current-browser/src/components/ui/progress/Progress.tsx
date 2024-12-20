import './Progress.css';

export default function Progress({ size = 24 }: { size?: number }) {
    return (
        <div className="spinner-container center">
            <div className="spinner" style={{ width: size, height: size }}>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
                <div className="segment"></div>
            </div>
        </div>
    )
}
