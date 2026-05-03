export default function Home() {
  return (
    <main className="appShell">
      <section className="phone">
        <header className="hero">
          <div className="heroText">
            <p className="label">家族限定アプリ</p>
            <h1>じいじの腎臓ノート</h1>
            <p className="subtitle">
              腎不全に向きあい頑張っている
              <br />
              じいじへの応援ノート
            </p>
          </div>

          <div className="familyIllust" aria-hidden="true">
            <div className="yellowCircle" />
            <div className="person grandpaFace">
              <span className="hair hairLeft" />
              <span className="hair hairRight" />
              <span className="eye eyeLeft" />
              <span className="eye eyeRight" />
              <span className="smile" />
            </div>
            <div className="person childFace">
              <span className="childHair" />
              <span className="eye eyeLeft" />
              <span className="eye eyeRight" />
              <span className="smile" />
            </div>
          </div>
        </header>

        <section className="dateCard">
          <p>今日の記録日</p>
          <strong>2026年5月4日</strong>
          <span>月曜日</span>
        </section>

        <section className="card">
          <div className="cardHeader">
            <span className="num">1</span>
            <h2>患者情報</h2>
          </div>

          <div className="patientGrid">
            <div>
              <p>お名前</p>
              <strong>じいじ</strong>
            </div>
            <div>
              <p>病名</p>
              <strong>慢性腎不全</strong>
            </div>
            <div>
              <p>今日の体重</p>
              <strong>58.2kg</strong>
            </div>
            <div>
              <p>目標</p>
              <strong>無理なく継続</strong>
            </div>
          </div>
        </section>

        <section className="card blueCard">
          <div className="cardHeader">
            <span className="num">2</span>
            <h2>今日の食事は目標と比べて</h2>
          </div>

          <div className="foodRows">
            <div>
              <span>カロリー</span>
              <strong>1,650 / 1,800 kcal</strong>
            </div>
            <div>
              <span>たんぱく質</span>
              <strong>42 / 50 g</strong>
            </div>
            <div>
              <span>塩分</span>
              <strong>5.8 / 6.0 g</strong>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <span className="num">3</span>
            <h2>今日の記録</h2>
          </div>

          <div className="recordGrid">
            <div className="recordItem">
              <span>体調</span>
              <strong>ふつう</strong>
            </div>
            <div className="recordItem">
              <span>食欲</span>
              <strong>あり</strong>
            </div>
            <div className="recordItem">
              <span>むくみ</span>
              <strong>なし</strong>
            </div>
            <div className="recordItem">
              <span>メモ</span>
              <strong>散歩できた</strong>
            </div>
          </div>
        </section>

        <section className="card graphCard">
          <h2>体重・血圧の1週間グラフ</h2>

          <div className="graph">
            <div className="bar h45" />
            <div className="bar h55" />
            <div className="bar h50" />
            <div className="bar h65" />
            <div className="bar h58" />
            <div className="bar h70" />
            <div className="bar h62" />
          </div>

          <div className="days">
            <span>月</span>
            <span>火</span>
            <span>水</span>
            <span>木</span>
            <span>金</span>
            <span>土</span>
            <span>日</span>
          </div>
        </section>

        <nav className="bottomTab">
          <a className="active">ホーム</a>
          <a>記録</a>
          <a>食事</a>
          <a>メモ</a>
          <a>設定</a>
        </nav>
      </section>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #eef7ff;
          color: #243447;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .appShell {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          background: linear-gradient(180deg, #eaf6ff 0%, #f8fbff 100%);
        }

        .phone {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          padding: 18px 14px 98px;
          background: #f4faff;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 22px 18px 24px;
          border-radius: 30px;
          background: linear-gradient(135deg, #e2f4ff 0%, #ffffff 100%);
          box-shadow: 0 14px 30px rgba(79, 149, 205, 0.14);
          overflow: hidden;
        }

        .heroText {
          position: relative;
          z-index: 2;
        }

        .label {
          display: inline-block;
          margin: 0 0 12px;
          padding: 7px 13px;
          border-radius: 999px;
          background: #ffffff;
          color: #2993d1;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(79, 149, 205, 0.08);
        }

        h1 {
          margin: 0;
          color: #145f94;
          font-size: 27px;
          line-height: 1.25;
          letter-spacing: 0.01em;
        }

        .subtitle {
          margin: 12px 0 0;
          color: #5d7588;
          font-size: 14px;
          line-height: 1.75;
          font-weight: 700;
        }

        .familyIllust {
          position: relative;
          width: 118px;
          min-width: 118px;
          height: 118px;
          align-self: center;
        }

        .yellowCircle {
          position: absolute;
          inset: 8px;
          border-radius: 999px;
          background: #ffefaa;
        }

        .person {
          position: absolute;
          border-radius: 24px;
          background: #fff6e6;
          box-shadow: 0 10px 20px rgba(79, 149, 205, 0.16);
        }

        .grandpaFace {
          left: 3px;
          bottom: 15px;
          width: 58px;
          height: 58px;
        }

        .childFace {
          right: 2px;
          top: 14px;
          width: 60px;
          height: 60px;
        }

        .hair {
          position: absolute;
          top: 7px;
          width: 18px;
          height: 14px;
          border-radius: 999px;
          background: #d8dfe6;
        }

        .hairLeft {
          left: 12px;
        }

        .hairRight {
          right: 12px;
        }

        .childHair {
          position: absolute;
          top: 4px;
          left: 13px;
          width: 34px;
          height: 20px;
          border-radius: 18px 18px 10px 10px;
          background: #f2b13e;
        }

        .eye {
          position: absolute;
          top: 30px;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #35556b;
        }

        .eyeLeft {
          left: 20px;
        }

        .eyeRight {
          right: 20px;
        }

        .smile {
          position: absolute;
          left: 50%;
          bottom: 14px;
          width: 18px;
          height: 9px;
          transform: translateX(-50%);
          border-bottom: 3px solid #e58a6a;
          border-radius: 0 0 999px 999px;
        }

        .dateCard,
        .card {
          margin-top: 18px;
          padding: 20px;
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 12px 26px rgba(79, 149, 205, 0.11);
        }

        .dateCard p {
          margin: 0 0 10px;
          color: #6c8192;
          font-size: 14px;
          font-weight: 800;
        }

        .dateCard strong {
          display: block;
          color: #145f94;
          font-size: 26px;
          line-height: 1.35;
        }

        .dateCard span {
          display: inline-block;
          margin-top: 9px;
          color: #6c8192;
          font-size: 15px;
          font-weight: 800;
        }

        .blueCard {
          background: #e6f6ff;
        }

        .cardHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }

        .num {
          display: grid;
          place-items: center;
          width: 31px;
          height: 31px;
          border-radius: 999px;
          background: #67bde8;
          color: #ffffff;
          font-weight: 900;
        }

        h2 {
          margin: 0;
          color: #235f87;
          font-size: 18px;
          line-height: 1.45;
          font-weight: 800;
        }

        .patientGrid,
        .recordGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .patientGrid div,
        .recordItem {
          padding: 15px 14px;
          border-radius: 20px;
          background: #f3f9ff;
        }

        .patientGrid p,
        .recordItem span,
        .foodRows span {
          display: block;
          margin: 0 0 7px;
          color: #71879a;
          font-size: 13px;
          font-weight: 800;
        }

        .patientGrid strong,
        .recordItem strong {
          color: #1d3347;
          font-size: 16px;
          font-weight: 900;
        }

        .foodRows {
          display: grid;
          gap: 11px;
        }

        .foodRows div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 15px 14px;
          border-radius: 18px;
          background: #ffffff;
        }

        .foodRows strong {
          color: #145f94;
          font-size: 15px;
          font-weight: 900;
          text-align: right;
        }

        .graphCard h2 {
          margin-bottom: 18px;
        }

        .graph {
          display: flex;
          align-items: end;
          justify-content: space-between;
          height: 130px;
          padding: 14px 12px 0;
          border-radius: 22px;
          background: #f3f9ff;
        }

        .bar {
          width: 30px;
          border-radius: 999px 999px 6px 6px;
          background: linear-gradient(180deg, #93d8f6, #55b6e2);
        }

        .h45 { height: 45%; }
        .h55 { height: 55%; }
        .h50 { height: 50%; }
        .h65 { height: 65%; }
        .h58 { height: 58%; }
        .h70 { height: 70%; }
        .h62 { height: 62%; }

        .days {
          display: flex;
          justify-content: space-between;
          padding: 9px 16px 0;
          color: #6c8192;
          font-size: 12px;
          font-weight: 800;
        }

        .bottomTab {
          position: fixed;
          left: 50%;
          bottom: 10px;
          transform: translateX(-50%);
          width: min(398px, calc(100% - 24px));
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          padding: 10px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 14px 30px rgba(79, 149, 205, 0.22);
          backdrop-filter: blur(12px);
        }

        .bottomTab a {
          padding: 10px 2px;
          border-radius: 18px;
          color: #7890a4;
          font-size: 12px;
          font-weight: 900;
          text-align: center;
          text-decoration: none;
        }

        .bottomTab .active {
          background: #dcf1ff;
          color: #2389c8;
        }
      `}</style>
    </main>
  );
}