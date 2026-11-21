V={'අ':'a','ආ':'ā','ඉ':'i','ඊ':'ī','උ':'u','ඌ':'ū','එ':'e','ඔ':'o','ඓ':'ai','ඖ':'au'}
C={'ක':'k','ඛ':'kh','ග':'g','ඝ':'gh','ඞ':'ṅ','ච':'c','ඡ':'ch','ජ':'j','ඣ':'jh','ඤ':'ñ','ට':'ṭ','ඨ':'ṭh','ඩ':'ḍ','ඪ':'ḍh','ණ':'ṇ','ත':'t','ථ':'th','ද':'d','ධ':'dh','න':'n','ප':'p','ඵ':'ph','බ':'b','භ':'bh','ම':'m','ය':'y','ර':'r','ල':'l','ව':'v','ස':'s','හ':'h','ළ':'ḷ','ඟ':'ṅg','ඬ':'ṇḍ','ඳ':'nd','ඹ':'mb','ශ':'ś','ෂ':'ṣ','ෆ':'f'}
S={'ා':'ā','ැ':'æ','ෑ':'ǣ','ි':'i','ී':'ī','ු':'u','ූ':'ū','ෙ':'e','ේ':'ē','ො':'o','ෝ':'ō','ෘ':'ṛ','ෛ':'ai','ෞ':'au'}
def tr(s):
    out=[];i=0;s=s.replace('‍','').replace('‌','')
    n=len(s)
    while i<n:
        ch=s[i]
        if ch in C:
            out.append(C[ch]); nx=s[i+1] if i+1<n else ''
            if nx=='්': i+=2; continue
            if nx in S: out.append(S[nx]); i+=2; continue
            out.append('a'); i+=1; continue
        if ch in V: out.append(V[ch]); i+=1; continue
        if ch=='ං': out.append('ṃ'); i+=1; continue
        if ch=='ඃ': out.append('ḥ'); i+=1; continue
        out.append(ch); i+=1
    return ''.join(out)
if __name__=='__main__':
    print(tr('සිගාලසුත්තං'), tr('නමො තස්ස භගවතො අරහතො සම්මා සම්බුද්ධස්ස'), tr('මංගලසුත්තං'))
