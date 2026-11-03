// Static MathML uses the browser's mathematical typesetting for fractions,
// summation limits, subscripts and radicals without a client-side renderer.
const formulaMarkup = `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="平均表现 P">
  <mi>P</mi><mo>=</mo>
  <mfrac>
    <mrow>
      <munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>
      <mfrac><msub><mi>S</mi><mi>i</mi></msub><msub><mi>M</mi><mi>i</mi></msub></mfrac>
    </mrow>
    <mi>n</mi>
  </mfrac>
</math>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="出场系数 C">
  <mi>C</mi><mo>=</mo><mi mathvariant="normal">min</mi><mo>⁡</mo><mo>(</mo><mn>1</mn><mo>,</mo>
  <mroot>
    <mfrac>
      <mi>n</mi>
      <mrow>
        <munderover><mo>∑</mo><mrow><mi>j</mi><mo>=</mo><mn>1</mn></mrow><mi>m</mi></munderover>
        <msub><mi>N</mi><mi>j</mi></msub>
      </mrow>
    </mfrac>
    <mn>3</mn>
  </mroot>
  <mo>)</mo>
</math>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="Rating 等于 P 乘以 C">
  <mi mathvariant="normal">Rating</mi><mo>=</mo><mi>P</mi><mo>×</mo><mi>C</mi>
</math>`;

export function RatingFormula() {
    return <div className="overflow-x-auto rounded-md bg-default-100 p-4 text-lg text-default-900 sm:text-xl">
        <div className="flex w-max min-w-full flex-col items-start gap-5 py-1 [&_math]:m-0"
            dangerouslySetInnerHTML={{__html: formulaMarkup}}/>
    </div>;
}
