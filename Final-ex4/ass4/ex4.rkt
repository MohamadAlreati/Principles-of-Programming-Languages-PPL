#lang racket

(provide (all-defined-out))

(define plus$
 (lambda (x y cont) (cont (+ x y))))
(define div$
  (lambda (x y cont) (cont (/ x y))))
(define square$
  (lambda (x cont) (cont(* x x))))
(define add1$
  (lambda (x cont) (cont(+ x 1))))
(define div2$
  (lambda (x cont) (cont(/ x 2))))
(define g-0$
  (lambda (n cont)
    (cont (if (> n 0) #t #f))))
(define bool-num$
  (lambda (b cont)
    (cont (if b 1 0))))
(define take
  (lambda (lz-lst n)
    (if (or (= n 0) (empty-lzl? lz-lst))
      empty-lzl
      (cons (head lz-lst)
                 (take (tail lz-lst) (- n 1))))))
(define integers-from
  (lambda (n)
    (cons-lzl n (lambda () (integers-from (+ n 1))))))

(define id (lambda (x) x))
(define cons-lzl cons)
(define empty-lzl? empty?)
(define empty-lzl '())
(define head car)
(define tail
  (lambda (lzl)
    ((cdr lzl))))


;;; Q1.a
; Signature: compose(f g)
; Type: [T1 -> T2] * [T2 -> T3]  -> [T1->T3]
; Purpose: given two unary functions return their composition, in the same order left to right
; test: ((compose - sqrt) 16) ==> -4
;       ((compose not not) true)==> true
(define compose
  (lambda (f g)
    (lambda (x)
       (g (f x)))))
      
(define compose$
  (lambda (f$ g$ c1)
    (c1 (lambda (x c2)
                (f$ x (lambda (res) (g$ res c2)))))))
; Signature: pipe(lst-fun)
; Type: [[T1 -> T2], [T2 -> T3], ..., [Tn-1 -> Tn]] -> [T1 -> Tn]
; Purpose: Returns the composition of a given list of unary functions. For (pipe (list f1 f2 ... fn)), returns the composition fn(....(f1(x)))
; test: ((pipe (list sqrt - - number?)) 16) ==> true
;       ((pipe (list sqrt - - number? not)) 16) ==> false
;       ((pipe (list sqrt add1 - )) 100) ==> -11

(define pipe
  (lambda (fs)  
    (if (empty? (cdr fs))
        (car fs)
        (compose (car fs) (pipe (cdr fs))))))

(define pipe$
  (lambda (fs c1)  
    (if (empty? (cdr fs))
        (c1 (lambda (x c2) ((car fs) x c2)))
        (pipe$ (cdr fs) (lambda (res) (compose$ (car fs) res c1))))))


;;; Q2a
; Signature: reduce1-lzl(reducer, init, lzl) 
; Type: [T2*T1 -> T2] * T2 * LzL<T1> -> T2
; Purpose: Returns the reduced value of the given lazy list
(define reduce1-lzl 
  (lambda (reducer init lzl)
   (if (empty-lzl? lzl)
      init
      (reduce1-lzl reducer (reducer init (head lzl)) (tail lzl))
    )
  )
)  

;;; Q2b
; Signature: reduce2-lzl(reducer, init, lzl, n) 
; Type: [T2*T1 -> T2] * T2 * LzL<T1> * Number -> T2
; Purpose: Returns the reduced value of the first n items in the given lazy list
(define reduce2-lzl 
  (lambda (reducer init lzl n)
    (if (or (empty-lzl? lzl) (= n 0))
      init
      (reduce2-lzl reducer (reducer init (head lzl)) (tail lzl) (- n 1))
    )
  )
)  

;;; Q2c
; Signature: reduce3-lzl(reducer, init, lzl) 
; Type: [T2 * T1 -> T2] * T2 * LzL<T1> -> Lzl<T2>
; Purpose: Returns the reduced values of the given lazy list items as a lazy list
(define reduce3-lzl 
  (lambda (reducer init lzl)
    (if (empty-lzl? lzl)
        '()
        (let ((next (reducer init (head lzl))))
          (cons-lzl next
                    (lambda () (reduce3-lzl reducer next (tail lzl)))))
    )
  )
)
  
 
;;; Q2e
; Signature: integers-steps-from(from,step) 
; Type: Number * Number -> Lzl<Number>
; Purpose: Returns a list of integers from 'from' with 'steps' jumps
(define integers-steps-from
  (lambda (from step)
    (cons-lzl from (lambda() (integers-steps-from (+ from step) step)))
  )
)

;;; Q2f
; Signature: generate-pi-approximations() 
; Type: Empty -> Lzl<Number>
; Purpose: Returns the approximations of pi as a lazy list
(define generate-pi-approximations
  (lambda ()
        (map-lzl (lambda (x) (* x 8)) (reduce3-lzl + 0 (map-lzl (lambda (x) (/ 1 (* x (+ x 2)))) (integers-steps-from 1 4))))))


;;;My helping functions
(define map-lzl
  (lambda (map-fn lzl)
    (if (empty-lzl? lzl)
        '()
        (cons-lzl (map-fn (head lzl))
                  (lambda () (map-lzl map-fn (tail lzl)))))))
