function DecisionLog({ rainEvent }) {
    return (
        <div className="panel">
            <h2>Decision Log</h2>

            <div className="log">
                <span>10:30</span>
                <p>Route calculated</p>
            </div>

            <div className="log">
                <span>10:31</span>
                <p>Rainfall checked</p>
            </div>

            {rainEvent && (
                <>
                    <div className="log">
                        <span>10:32</span>
                        <p>⚠️ Heavy rainfall detected</p>
                    </div>

                    <div className="log">
                        <span>10:32</span>
                        <p>Risk increased to 82%</p>
                    </div>

                    <div className="log">
                        <span>10:33</span>
                        <p>🔄 Reroute recommended</p>
                    </div>
                </>
            )}
        </div>
    )
}

export default DecisionLog