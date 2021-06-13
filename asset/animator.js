function animator(svg) {
    function to_element(element) {
        if (typeof element == 'string')
            element = svg.querySelector(element);
        return element;
    }

    function clear(selector) {
        var element = to_element(selector);
        element.innerHTML = '';
    }

    function moveto(selector, x, y, cb) {
        var element = to_element(selector);
        var animate = document.createElementNS("http://www.w3.org/2000/svg", 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'translate');
        animate.setAttribute('to', x + ' ' + y);
        animate.setAttribute('dur', '0.5s');
        animate.setAttribute('begin', 'indefinite');
        animate.setAttribute('fill', 'freeze');
        animate.addEventListener('endEvent', function() {
            this.parentNode.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
            this.parentNode.removeChild(this);
            if (cb)
                cb();
        });
        element.appendChild(animate);
        animate.beginElement();
    }

    function add_circle(selector, x, y, r, txt) {
        var element = to_element(selector);

        var g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
        element.appendChild(g);

        var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        circle.setAttribute('r', r);
        g.appendChild(circle);

        var text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        text.innerHTML = txt;
        g.appendChild(text);

        return {
            'ator': this,
            'g': g,
            'circle': circle,
            'text': text,
            'x': x,
            'y': y,
            'moveto': function(x, y, cb) {
                this.ator.moveto(this.g, x, y, cb);
                this.x = x;
                this.y = y;
            }
        };
    }

    function add_line(selector, x1, y1, x2, y2, marker, r1, r2) {
        var element = to_element(selector);

        var m = Math.atan2(y2-y1, x2-x1);
        if (r1) {
          x1 += r1*Math.cos(m);
          y1 += r1*Math.sin(m);
        }
        if (r2) {
          x2 -= r2*Math.cos(m);
          y2 -= r2*Math.sin(m);
        }

        var line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        if (marker)
          line.setAttribute('marker-end', 'url(#' + marker + ')')
        element.appendChild(line);

        return {
            'ator': this,
            'line': line,
        };
    }

    function add_code(selector, code) {
        function replaceAll(search, replacement, target) {
            return target.split(search).join(replacement);
        }

        var code = Prism.highlight(code.trim(), Prism.languages.c);
        code = replaceAll('</span>', '</tspan>', replaceAll('<span', '<tspan', code));
        var lines = code.split('\n');
        for (var i = 0; i < lines.length; ++i)
            lines[i] = '<tspan class="line-'+i+'" x="0" dy="1.12em"><tspan class="debug">‣</tspan>' + lines[i] + '</tspan>';
        code = lines.join('');

        var element = to_element(selector);
        element.innerHTML = code;
    }

    /* exports */
    this.svg = svg;
    this.clear = clear;
    this.moveto = moveto;
    this.add_circle = add_circle;
    this.add_line = add_line;
    this.add_code = add_code;
}
