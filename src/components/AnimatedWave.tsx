export default function AnimatedWave() {
  return (
    <div className="absolute bottom-0 left-0 w-full">
      <svg
        className="waves"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-25 88-25s58 25 88 25 58-25 88-25 58 25 88 25v44h-352z"
          />
        </defs>
        <g className="parallax">
          <use
            xlinkHref="#gentle-wave"
            x="48"
            y="0"
            fill="rgba(255,183,0,0.7)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="48"
            y="3"
            fill="rgba(255,183,0,0.5)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="48"
            y="5"
            fill="rgba(255,183,0,0.3)"
          />
          <use xlinkHref="#gentle-wave" x="48" y="7" fill="#FFB700" />
        </g>
      </svg>
    </div>
  );
}
