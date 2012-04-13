(ns codegroup.server
  (:use compojure.core, aleph.core, aleph.http, lamina.core, ring.middleware.reload)
  (:require [compojure.route :as route])
  (:require [codegroup.views :as views])
  (:gen-class))

(def broadcast-channel (permanent-channel))

(defn chat-handler [ch handshake]
  (receive ch
           (fn [name]
             (println (str "handler called on channel: " ch))
             (siphon (map* #(str name ": " %) ch) broadcast-channel)
             (siphon broadcast-channel ch))))
;             (siphon ch broadcast-channel))))




(defroutes my-app 
  (GET "/" [] (views/layout views/main-view))
  (GET "/tryclj" [] views/tryclj)
  (GET "/socket" [] (wrap-aleph-handler chat-handler))
  (route/resources "/")
  (route/not-found (views/layout [:p "aww... this doesn't exist"])))

(defn -main []
  (start-http-server 
    (wrap-ring-handler 
      (wrap-reload my-app '(codegroup.server codegroup.views))) {:port 8080 :websocket true})
  (println "server started"))
